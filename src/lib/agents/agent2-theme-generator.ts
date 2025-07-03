// Agent 2: Theme Generator
// Model: o3-2025-04-16 or Claude Sonnet 4 (with thinking enabled)
// Purpose: Generate 3 campaign ideas based on marketing brief and whitepaper

import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { BasicWorkflowState, Theme } from "../schemas/types";
import {
  pineconeSearchTool,
  getWhitepaperConfig,
  listAvailableWhitepapers,
} from "../tools/pinecone-search";

// Schema for Agent 2's structured output
const ThemeGenerationOutputSchema = z.object({
  themes: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        whyItWorks: z.array(z.string()).length(3),
        detailedDescription: z.string(),
      })
    )
    .length(3),
  searchSummary: z
    .string()
    .describe("Summary of what was found in the whitepaper"),
});

export async function themeGeneratorAgent(
  state: BasicWorkflowState
): Promise<Partial<BasicWorkflowState>> {
  console.log("🤖 Agent 2: Theme Generator starting...");
  console.log(`📊 Previous themes count: ${state.previousThemes?.length || 0}`);
  console.log(`🔄 Regeneration count: ${state.regenerationCount}`);

  try {
    // Initialize OpenAI model (GPT-4 supports temperature)
    const llm = new ChatOpenAI({
      model: "gpt-4", // Use GPT-4 which supports temperature
      temperature: 0.7,
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Get whitepaper configuration dynamically from database
    console.log("🔍 Getting whitepaper configuration from database...");

    // For testing, specifically use the "Prepared Minds by Brilliant Noise" whitepaper
    // which has smaller chunks that work with reranking
    let whitepaperConfig;
    try {
      whitepaperConfig = await getWhitepaperConfig("Prepared Minds");
      console.log(
        `✅ Config retrieved: Index=${whitepaperConfig.indexName}, Namespace=${whitepaperConfig.namespace}`
      );

      // Verify we got the right whitepaper
      if (!whitepaperConfig.namespace.includes("Prepared-Minds")) {
        throw new Error("Wrong whitepaper found, will use fallback");
      }
    } catch (error) {
      console.log("🔄 Fallback: Using first available whitepaper...");
      const availableWhitepapers = await listAvailableWhitepapers();
      if (availableWhitepapers.length === 0) {
        throw new Error(
          "No whitepapers found in database. Please upload a whitepaper first."
        );
      }
      const firstWhitepaper = availableWhitepapers[0];
      whitepaperConfig = await getWhitepaperConfig(firstWhitepaper.name);
      console.log(`📄 Using fallback: ${firstWhitepaper.name}`);
    }

    // Step 1: Comprehensive whitepaper research
    console.log("🔍 Starting comprehensive whitepaper research...");

    // Parse the marketing brief from Agent 1
    let marketingBrief;
    try {
      marketingBrief =
        typeof state.marketingBrief === "string"
          ? JSON.parse(state.marketingBrief)
          : state.marketingBrief;
    } catch (error) {
      console.error("❌ Failed to parse marketing brief:", error);
      throw new Error("Invalid marketing brief format");
    }

    // Generate diverse search queries based on marketing brief
    const searchQueries = [
      // Broad context searches
      `${marketingBrief.targetPersona?.demographic || state.targetAudience} challenges`,
      `${marketingBrief.targetPersona?.psychographic || state.targetAudience} motivations`,
      marketingBrief.campaignObjectives?.[0] ||
        state.marketingGoals ||
        "business objectives",

      // Pain point focused searches
      ...(marketingBrief.targetPersona?.painPoints || []).slice(0, 2),

      // Key message searches
      ...(marketingBrief.keyMessages || []).slice(0, 2),

      // Business context searches
      state.businessContext + " solutions",
      state.businessContext + " benefits",

      // Avoid previous search terms if regenerating
      ...generateNewSearchQueries(
        state.searchHistory || [],
        state.regenerationCount || 0
      ),
    ];

    // Remove empty/undefined queries and deduplicate
    const cleanSearchQueries = [
      ...new Set(searchQueries.filter((query) => query && query.trim())),
    ];

    console.log(
      `🎯 Generated ${cleanSearchQueries.length} search queries:`,
      cleanSearchQueries
    );

    // Perform multiple Pinecone searches
    let allSearchResults: any[] = [];
    let successfulSearches = 0;

    for (const query of cleanSearchQueries.slice(0, 8)) {
      // Limit to 8 searches max
      try {
        console.log(`🔍 Searching (${successfulSearches + 1}/8): "${query}"`);

        const searchResult = await pineconeSearchTool.invoke({
          query,
          whitepaperNamespace: whitepaperConfig.namespace,
          indexName: whitepaperConfig.indexName,
          topK: 10,
          topN: 5,
        });

        const parsedResults = JSON.parse(searchResult);
        allSearchResults.push(...parsedResults.results);
        successfulSearches++;

        // Brief pause between searches to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Search failed for "${query}":`, error);
      }
    }

    console.log(
      `✅ Research complete: ${allSearchResults.length} total results from ${successfulSearches} successful searches`
    );

    if (allSearchResults.length === 0) {
      throw new Error(
        "No search results found. Please check your Pinecone configuration and whitepaper content."
      );
    }

    // Deduplicate results by ID and take top results by score
    const uniqueResults = Array.from(
      new Map(allSearchResults.map((result) => [result.id, result])).values()
    )
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 20); // Top 20 unique results

    // Step 2: Generate themes using comprehensive research
    const systemPrompt = `You are a creative marketing strategist. Generate 3 unique campaign themes based on the marketing brief and whitepaper research.

KEY REQUIREMENTS:
- All content MUST come from the whitepaper research provided
- Themes must align with the marketing brief objectives
- Each theme must be distinct and non-overlapping
- Avoid any themes similar to these previous ones: ${JSON.stringify(state.previousThemes?.map((t) => t.title) || [])}
- Focus on actionable insights from the whitepaper content

For each theme, provide:
- Compelling title (2-4 words)
- Brief description (1-2 sentences)
- 3 specific reasons why this works for the target persona
- Detailed description (2-3 paragraphs) with specific whitepaper insights

Return ONLY valid JSON matching this exact structure:
{
  "themes": [
    {
      "id": "theme-1",
      "title": "Theme Title",
      "description": "Brief description...",
      "whyItWorks": ["Reason 1", "Reason 2", "Reason 3"],
      "detailedDescription": "Detailed 2-3 paragraph description with specific whitepaper insights..."
    }
  ],
  "searchSummary": "Summary of key insights found in whitepaper research"
}`;

    const userPrompt = `Create 3 campaign themes based on:

MARKETING BRIEF:
- Business Context: ${state.businessContext}
- Target Audience: ${state.targetAudience}
- Marketing Goals: ${state.marketingGoals}
- Executive Summary: ${marketingBrief.executiveSummary || "Not provided"}
- Campaign Objectives: ${JSON.stringify(marketingBrief.campaignObjectives || [])}
- Key Messages: ${JSON.stringify(marketingBrief.keyMessages || [])}
- Target Persona: ${JSON.stringify(marketingBrief.targetPersona || {})}

WHITEPAPER RESEARCH RESULTS (Top ${uniqueResults.length} results):
${uniqueResults
  .map(
    (result, i) => `
Result ${i + 1} (Relevance Score: ${result.score?.toFixed(4) || "N/A"}):
${result.text}
Category: ${result.category || "General"}
`
  )
  .join("\n")}

PREVIOUS THEMES TO AVOID:
${state.previousThemes?.map((theme) => `- ${theme.title}: ${theme.description}`).join("\n") || "None"}

Generate 3 completely new, distinct themes that haven't been created before. Each theme should leverage different aspects of the whitepaper content.`;

    console.log("🤖 Calling LLM to generate themes...");

    // Call LLM to generate themes
    const response = await llm.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    console.log("📝 LLM Response received, parsing...");

    // Parse and validate response
    let themeData;
    try {
      const content = response.content as string;
      // Extract JSON from response if wrapped in markdown or other text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      themeData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("❌ Failed to parse LLM response:", parseError);
      console.error("Raw response:", response.content);
      throw new Error("Failed to parse theme generation response");
    }

    const validatedOutput = ThemeGenerationOutputSchema.parse(themeData);

    console.log("✅ Agent 2: Generated 3 new themes successfully");
    console.log(
      `📋 Themes: ${validatedOutput.themes.map((t) => t.title).join(", ")}`
    );

    return {
      generatedThemes: validatedOutput.themes,
      searchHistory: [...(state.searchHistory || []), ...cleanSearchQueries],
      regenerationCount: (state.regenerationCount || 0) + 1,
      currentStep: "themes_generated",
      needsHumanInput: true, // Pause for user to select theme
    };
  } catch (error) {
    console.error("❌ Agent 2 Error:", error);
    throw new Error(
      `Theme generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Helper function to generate new search queries for regeneration
function generateNewSearchQueries(
  previousSearches: string[],
  regenerationCount: number
): string[] {
  const baseQueries = [
    "innovative solutions",
    "market trends",
    "future outlook",
    "competitive advantages",
    "emerging opportunities",
    "industry insights",
    "best practices",
    "implementation strategies",
    "success factors",
    "case studies",
    "expert recommendations",
    "proven methods",
  ];

  // Add variation based on regeneration count
  const variationQueries = [
    `approach ${regenerationCount}`,
    `strategy ${regenerationCount}`,
    `method ${regenerationCount}`,
    `solution ${regenerationCount}`,
  ];

  const allQueries = [...baseQueries, ...variationQueries];

  // Filter out previously used queries and return fresh ones
  return allQueries
    .filter((query) => !previousSearches.some((prev) => prev.includes(query)))
    .slice(0, 3);
}

export type ThemeGenerationOutput = z.infer<typeof ThemeGenerationOutputSchema>;
