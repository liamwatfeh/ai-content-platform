// Agent 2: Theme Generator
// Model: claude-sonnet-4-20250514 (Claude Sonnet 4 with thinking enabled)
// Purpose: Generate 3 concept seeds based on iterative research and marketing brief

import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";
import { pineconeSearchTool } from "../tools/pinecone-search";
import { BasicWorkflowState, Theme } from "../schemas/types";
import { getWhitepaperConfigById } from "../tools/pinecone-search";
import { MessageContent, MessageContentText } from "@langchain/core/messages";
import { themesParser, getFormatInstructions } from "../tools/output-parsers";
import { StructuredOutputParser } from "@langchain/core/output_parsers";

// Type for search results
interface SearchResult {
  id: string;
  score?: number;
  text: string;
  category?: string;
}

// Schema for Agent 2's structured output - updated for 3 concept seeds
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
    .length(3), // Changed from 6 to 3 concept seeds
  searchSummary: z
    .string()
    .describe("Summary of iterative research findings and methodology"),
});

// Schema for initial queries
const InitialQueriesSchema = z.array(z.string()).min(2).max(3);
const initialQueriesParser =
  StructuredOutputParser.fromZodSchema(InitialQueriesSchema);

// Schema for analysis response
const AnalysisSchema = z.object({
  analysis: z.string(),
  nextQueries: z.array(z.string()).min(2).max(3),
});
const analysisParser = StructuredOutputParser.fromZodSchema(AnalysisSchema);

export async function themeGeneratorAgent(
  state: BasicWorkflowState
): Promise<Partial<BasicWorkflowState>> {
  console.log("🤖 Agent 2: Theme Generator starting iterative research...");
  console.log(`📊 Previous themes count: ${state.previousThemes?.length || 0}`);
  console.log(`🔄 Regeneration count: ${state.regenerationCount}`);

  try {
    // Initialize Claude Sonnet 4 model
    const llm = new ChatAnthropic({
      model: "claude-sonnet-4-20250514", // Claude Sonnet 4 with thinking enabled
      apiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 0.3,
    });

    // Get whitepaper configuration dynamically from database
    console.log("🔍 Getting whitepaper configuration from database...");

    // Validate that a whitepaper was selected
    if (!state.selectedWhitepaperId) {
      throw new Error(
        "No whitepaper selected. Please select a whitepaper first."
      );
    }

    // Get whitepaper configuration based on selected whitepaper ID
    let whitepaperConfig;
    try {
      console.log(
        `📄 Using selected whitepaper ID: ${state.selectedWhitepaperId}`
      );
      whitepaperConfig = await getWhitepaperConfigById(
        state.selectedWhitepaperId
      );
      console.log(
        `✅ Config retrieved: Index=${whitepaperConfig.indexName}, Namespace=${whitepaperConfig.namespace}`
      );
    } catch (err) {
      console.error("❌ Failed to get whitepaper configuration:", err);
      throw new Error(
        `Failed to get whitepaper configuration: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }

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

    // Get whitepaper context for the new prompt
    const whitepaperContext =
      whitepaperConfig.namespace || "Company whitepaper content";

    // Modified system prompt to emphasize iterative searching
    const systemPrompt = `You are an iterative research agent that builds understanding progressively through sequential searches. Your goal is to:

1. Start with 2-3 broad, exploratory queries
2. Analyze those results carefully
3. Form more specific queries based on interesting findings
4. Continue this pattern of search → analyze → search until you've built a comprehensive understanding

IMPORTANT:
- Don't plan all searches upfront
- Each new search should be informed by previous results
- Follow interesting threads as you discover them
- Build understanding progressively
- Stop searching when you've exhausted valuable angles or reached 12 total searches

Your final output should include 3 concept seeds based on your progressive research.

**ASPIRATION**: Become the "treasure hunter and initial creative" who conducts thorough, iterative research to uncover the whitepaper's most valuable insights. Start with broad strategic queries based on the whitepaper context, analyze what's promising, then drill deeper with targeted follow-up queries. Build comprehensive understanding through 8-12 strategic searches before synthesizing findings into concept seeds.

**RESULTS**: Execute systematic iterative research following this approach:

**SEARCH STRATEGY**:
1. **Initial Broad Phase (3-4 queries)**: Start with high-level topics from whitepaper context
2. **Analysis Phase**: Evaluate which broad searches yielded the most promising insights  
3. **Deep Dive Phase (4-6 queries)**: Create targeted queries to drill deeper into promising areas
4. **Follow-up Phase (2-4 queries)**: Pursue specific details, statistics, or methodologies found in deep dives
5. **Synthesis Phase**: Transform comprehensive findings into 3 concept seeds (MUST BE 3)

**EACH SEARCH ITERATION MUST**:
- Build on previous findings rather than repeat similar searches
- Follow the most promising threads from previous results
- Get progressively more specific and targeted
- Stop only when you've exhausted promising angles or hit search limits

**KISMET**: The magic happens when your 8th search uncovers the detail that transforms a good insight into an amazing concept seed - this is why iterative searching matters.

**WORKFLOW CONTEXT**: You're the "First Ideas" agent conducting thorough investigative research. The Brief Analysis Agent has provided strategic direction, and your concept seeds will feed into the Concept Synthesis Agent, who will refine and expand your ideas. Don't rush - comprehensive research now saves work later and produces better concepts.

**STAGE OBJECTIVE**: Conduct thorough iterative research (8-12 searches minimum) to uncover deep insights and transform them into compelling concept seeds.

**SEARCH EXECUTION REQUIREMENTS**:
- **Minimum 8 searches, target 10-12 searches**
- **Each search must build on previous findings**  
- **Progress from broad → specific → detailed**
- **Follow promising threads until exhausted**
- **Document your reasoning for each query**`;

    const userPrompt = `**WHITEPAPER CONTEXT**: ${whitepaperContext}

**MARKETING BRIEF CONTEXT**:
- Business Context: ${state.businessContext}
- Target Audience: ${state.targetAudience}
- Marketing Goals: ${state.marketingGoals}
- Executive Summary: ${marketingBrief.executiveSummary || "Not provided"}
- Campaign Objectives: ${JSON.stringify(
      marketingBrief.campaignObjectives || []
    )}
- Key Messages: ${JSON.stringify(marketingBrief.keyMessages || [])}
- Target Persona: ${JSON.stringify(marketingBrief.targetPersona || {})}

**PREVIOUS THEMES TO AVOID**:
${
  state.previousThemes
    ?.map((theme: Theme) => `- ${theme.title}: ${theme.description}`)
    .join("\n") || "None"
}

Based on this context, generate 2-3 initial broad queries to begin our research.
Return only a JSON array of queries, for example: ["query1", "query2", "query3"]`;

    // Get initial queries with structured parsing
    const initialQueriesPrompt = `${userPrompt}\n\n${initialQueriesParser.getFormatInstructions()}`;

    const initialQueriesResponse = await llm.invoke([
      {
        role: "system",
        content:
          "Generate 2-3 initial broad search queries. Follow the format instructions exactly.",
      },
      { role: "user", content: initialQueriesPrompt },
    ]);

    let currentQueries: string[];
    try {
      // Handle MessageContent type properly and use structured parsing
      const content = initialQueriesResponse.content;
      const textContent = Array.isArray(content)
        ? (content[0] as MessageContentText).text
        : (content as string);

      currentQueries = await initialQueriesParser.parse(textContent);
      console.log("✅ Initial queries parsed successfully:", currentQueries);
    } catch (error) {
      console.error("❌ Failed to parse initial queries:", error);
      throw new Error("Failed to generate valid initial queries");
    }

    // Execute iterative searches
    const allSearchResults: SearchResult[] = [];
    const searchExecutionLog: Array<{
      query: string;
      resultCount: number;
      analysis: string;
      nextQueries: string[];
    }> = [];

    console.log("🔄 Starting iterative search process...");

    let totalSearches = 0;
    const MAX_SEARCHES = 12;

    while (totalSearches < MAX_SEARCHES && currentQueries.length > 0) {
      for (const query of currentQueries) {
        if (totalSearches >= MAX_SEARCHES) break;

        console.log(
          `🔍 Search ${totalSearches + 1}/${MAX_SEARCHES}: "${query}"`
        );

        try {
          const searchResult = await pineconeSearchTool.invoke({
            query,
            whitepaperNamespace: whitepaperConfig.namespace,
            indexName: whitepaperConfig.indexName,
            topK: 10,
            topN: 5,
          });

          const parsedResults = JSON.parse(searchResult);
          allSearchResults.push(...parsedResults.results);

          // Analyze results and plan next queries
          const analysisPrompt = `Analyze these search results and suggest 2-3 follow-up queries to dig deeper:

Search Query: "${query}"
Results:
${JSON.stringify(parsedResults.results, null, 2)}

Previous Searches: ${searchExecutionLog.map((log) => log.query).join(", ")}

${analysisParser.getFormatInstructions()}`;

          const analysisResponse = await llm.invoke([
            {
              role: "system",
              content:
                "Analyze search results and plan next queries. Follow the format instructions exactly.",
            },
            { role: "user", content: analysisPrompt },
          ]);

          let analysis;
          try {
            // Handle MessageContent type properly and use structured parsing
            const content = analysisResponse.content;
            const textContent = Array.isArray(content)
              ? (content[0] as MessageContentText).text
              : (content as string);

            analysis = await analysisParser.parse(textContent);
            console.log(`✅ Analysis parsed successfully for query "${query}"`);
          } catch (error) {
            console.error("Failed to parse analysis response:", error);
            analysis = {
              analysis: "Failed to analyze results",
              nextQueries: [],
            };
          }

          searchExecutionLog.push({
            query,
            resultCount: parsedResults.results.length,
            analysis: analysis.analysis,
            nextQueries: analysis.nextQueries,
          });

          // Update queries for next iteration
          currentQueries = analysis.nextQueries;

          totalSearches++;

          // Brief pause between searches
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`❌ Search failed for "${query}":`, error);
          searchExecutionLog.push({
            query,
            resultCount: 0,
            analysis: `Search failed: ${error}`,
            nextQueries: [],
          });
          totalSearches++;
        }
      }
    }

    console.log(
      `✅ Research complete: ${allSearchResults.length} total results from ${searchExecutionLog.length} searches`
    );

    if (allSearchResults.length === 0) {
      throw new Error(
        "No search results found. Please check your Pinecone configuration and whitepaper content."
      );
    }

    // Deduplicate results by ID and take top results by score
    const uniqueResults = Array.from(
      new Map(
        allSearchResults.map((result: SearchResult) => [result.id, result])
      ).values()
    )
      .sort(
        (a: SearchResult, b: SearchResult) => (b.score || 0) - (a.score || 0)
      )
      .slice(0, 30); // Top 30 unique results for comprehensive analysis

    // Generate 3 concept seeds based on comprehensive research
    const conceptSynthesisPrompt = `Based on your completed iterative research, now synthesize your findings into exactly 3 concept seeds.

**RESEARCH RESULTS** (Top ${uniqueResults.length} findings):
${uniqueResults
  .map(
    (result: SearchResult, i) => `
Result ${i + 1} (Score: ${result.score?.toFixed(4) || "N/A"}):
${result.text}
Category: ${result.category || "General"}
`
  )
  .join("\n")}

**SEARCH EXECUTION LOG**:
${searchExecutionLog
  .map(
    (log, i) => `
Search ${i + 1}: "${log.query}"
Results: ${log.resultCount} findings
Analysis: ${log.analysis}
`
  )
  .join("\n")}

**SYNTHESIS REQUIREMENTS**:
- Generate exactly 3 concept seeds
- Each must leverage different aspects of your research findings
- Build on the iterative insights you've uncovered
- Avoid any similarity to previous themes: ${JSON.stringify(
      state.previousThemes?.map((t: Theme) => t.title) || []
    )}
- Focus on competitive advantages discovered

${themesParser.getFormatInstructions()}`;

    console.log("🤖 Synthesizing research into 3 concept seeds...");

    // Call LLM to synthesize findings into concept seeds
    const conceptResponse = await llm.invoke([
      {
        role: "system",
        content:
          "You are synthesizing comprehensive research findings into 3 distinct concept seeds. Follow the format instructions exactly.",
      },
      { role: "user", content: conceptSynthesisPrompt },
    ]);

    console.log("📝 Concept synthesis received, parsing...");

    // Parse and validate the final response using structured parsing
    let conceptData;
    try {
      const content = conceptResponse.content as string;
      conceptData = await themesParser.parse(content);
      console.log("✅ Theme generation output parsed successfully");

      // Add detailed theme logging
      console.log("\n📊 GENERATED THEMES DETAILS:");
      console.log(JSON.stringify(conceptData, null, 2));
      console.log("\n🎯 Individual Theme Summaries:");
      conceptData.themes.forEach((theme, index) => {
        console.log(`\nTheme ${index + 1}: ${theme.title}`);
        console.log("Description:", theme.description);
        console.log("Why It Works:");
        theme.whyItWorks.forEach((reason, i) =>
          console.log(`  ${i + 1}. ${reason}`)
        );
        console.log("Detailed Description:", theme.detailedDescription);
        console.log("---");
      });
    } catch (parseError) {
      console.error("❌ Failed to parse concept response:", parseError);
      throw new Error("Failed to generate valid concept seeds");
    }

    console.log("✅ Agent 2: Generated 3 concept seeds successfully");
    console.log(
      `📋 Concepts: ${conceptData.themes.map((t) => t.title).join(", ")}`
    );

    return {
      generatedThemes: conceptData.themes,
      searchHistory: searchExecutionLog.map((log) => log.query),
      regenerationCount: (state.regenerationCount || 0) + 1,
      currentStep: "themes_generated",
      needsHumanInput: true, // Pause for user to select theme
    };
  } catch (error) {
    console.error("❌ Agent 2 Error:", error);
    throw new Error(
      `Theme generation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export type ThemeGenerationOutput = z.infer<typeof ThemeGenerationOutputSchema>;
