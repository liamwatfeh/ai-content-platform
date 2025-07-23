// Agent 4a: Article Writer
// Model: Claude Sonnet 4 (with thinking enabled)
// Purpose: Draft 1-3 articles using Economist style guide and research from Agent 3

import { ChatAnthropic } from "@langchain/anthropic";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import type {
  BasicWorkflowState,
  ArticleOutput,
  ResearchDossier,
  MarketingBrief,
} from "../schemas/types";
import { ArticleOutputSchema } from "../schemas/types";
import {
  pineconeSearchTool,
  getWhitepaperConfigById,
} from "../tools/pinecone-search";

// Search result interface for Pinecone
interface SearchResult {
  id: string;
  score?: number;
  text: string;
  category?: string;
}

// Initialize Claude Sonnet 4 with thinking enabled and tool binding
const baseLlm = new ChatAnthropic({
  modelName: "claude-sonnet-4-20250514",
  temperature: 0.7,
  maxTokens: 4000,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

// Bind Pinecone search tool for autonomous calling
const llm = baseLlm.bindTools([pineconeSearchTool]);

// Create output parser for article generation
const articleOutputParser =
  StructuredOutputParser.fromZodSchema(ArticleOutputSchema);

export async function articleWriterAgent(
  state: BasicWorkflowState
): Promise<Partial<BasicWorkflowState>> {
  console.log("🖋️ Agent 4a: Starting article generation...");

  try {
    // Validate inputs
    if (!state.marketingBrief) {
      throw new Error("Marketing brief is required for article generation");
    }

    if (!state.researchDossier) {
      throw new Error("Research dossier is required for article generation");
    }

    if (!state.selectedTheme) {
      throw new Error("Selected theme is required for article generation");
    }

    // Parse the marketing brief from Agent 1 (handles Agent 1 output format)
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

    const researchDossier = state.researchDossier as ResearchDossier;
    const articlesCount = state.articlesCount || 1;

    // Get whitepaper configuration for tool context
    let whitepaperConfig;
    let whitepaperTitle = "the selected whitepaper";
    if (state.selectedWhitepaperId) {
      try {
        whitepaperConfig = await getWhitepaperConfigById(
          state.selectedWhitepaperId
        );
        console.log(
          `📄 Whitepaper config loaded: namespace=${whitepaperConfig.namespace}, index=${whitepaperConfig.indexName}`
        );

        // Get whitepaper title for context (simple query)
        const { supabase } = await import("../supabase");
        const { data: whitepaper } = await supabase
          .from("whitepapers")
          .select("title, filename")
          .eq("id", state.selectedWhitepaperId)
          .single();

        if (whitepaper) {
          whitepaperTitle =
            whitepaper.title ||
            whitepaper.filename ||
            "the selected whitepaper";
          console.log(`📄 Whitepaper title: ${whitepaperTitle}`);
        }
      } catch (error) {
        console.warn("⚠️ Could not load whitepaper config:", error);
      }
    }

    console.log(
      `📝 Generating ${articlesCount} article(s) using research dossier...`
    );

    // Create the article generation prompt (using Agent 1 output format)
    const articlePrompt = `MARKETING BRIEF:
Executive Summary: ${marketingBrief.executiveSummary || "Not provided"}
Target Persona: ${JSON.stringify(marketingBrief.targetPersona || {})}
Campaign Objectives: ${JSON.stringify(marketingBrief.campaignObjectives || [])}
Key Messages: ${JSON.stringify(marketingBrief.keyMessages || [])}
Call to Action: ${JSON.stringify(marketingBrief.callToAction || {})}

SELECTED THEME: ${state.selectedTheme.title}
Description: ${state.selectedTheme.description}
Why it works: ${Array.isArray(state.selectedTheme.whyItWorks) ? state.selectedTheme.whyItWorks.join(" | ") : state.selectedTheme.whyItWorks || "Not specified"}

RESEARCH DOSSIER:
Key Findings (${researchDossier.whitepaperEvidence.keyFindings.length} total):
${researchDossier.whitepaperEvidence.keyFindings
  .map(
    (finding, i) =>
      `${i + 1}. ${finding.claim} (Evidence: ${finding.evidence}) [Confidence: ${finding.confidence}]`
  )
  .join("\n")}

SUGGESTED CONCEPTS:
${researchDossier.suggestedConcepts
  .map(
    (concept, i) =>
      `${i + 1}. ${concept.title}
   Angle: ${concept.angle}
   Why it works: ${concept.whyItWorks}
   Key Evidence: ${Array.isArray(concept.keyEvidence) ? concept.keyEvidence.join(" | ") : concept.keyEvidence || "Not specified"}
   Direction: ${concept.contentDirection}`
  )
  .join("\n\n")}

Articles to generate: ${articlesCount}
CTA Type: ${state.ctaType}${state.ctaUrl ? ` (URL: ${state.ctaUrl})` : ""}

${articleOutputParser.getFormatInstructions()}`;

    console.log("🎯 Generating articles with Claude Sonnet 4...");

    // Generate articles using Claude with tool access
    const systemPrompt = `You are an expert article writer following The Economist style guide. Generate compelling, evidence-based articles that achieve the marketing objectives while maintaining journalistic integrity and engaging the target audience.

CRITICAL OUTPUT REQUIREMENT:
You MUST respond with ONLY the JSON output specified in the format instructions. Do NOT include any explanatory text, reasoning, or tool usage descriptions. Output ONLY the valid JSON structure.

AVAILABLE TOOL:
You have access to a Pinecone search tool that can search through "${whitepaperTitle}" if you need additional evidence, specific quotes, or deeper details beyond what's provided in the research dossier. 

IMPORTANT: If you use the search tool, ensure your final response contains ONLY the complete JSON output with the articles, not any intermediate thoughts or explanations.

The tool searches through the whitepaper content and returns relevant passages. Use it strategically when:
- You need specific statistics or data points not in the research dossier
- You want to find compelling quotes or examples
- You need to verify or expand on evidence claims
- You want additional context for specific concepts

TOOL USAGE GUIDELINES:
- Use short, focused search queries (2-6 words) for best results
- Examples: "ROI statistics", "case study results", "implementation challenges"
- Only search if you genuinely need additional evidence beyond the provided research
- The research dossier already contains comprehensive findings, so use the tool judiciously
- After any tool usage, provide ONLY the final JSON output

ARTICLE REQUIREMENTS:
- Generate exactly the specified number of articles
- Each article should be ~1000 words
- Follow The Economist style: clear, analytical, authoritative but accessible
- Use active voice and compelling headlines
- Integrate whitepaper evidence naturally
- Each article should use a different suggested concept if multiple articles requested
- Include proper call-to-action aligned with marketing goals

ARTICLE STRUCTURE:
- Compelling headline that captures the essence
- Supporting subheadline
- Introduction that hooks the reader
- Body with clear sections and evidence integration
- Conclusion with key takeaways
- Appropriate call-to-action

FINAL REMINDER: Your response must be ONLY valid JSON matching the specified format. No additional text, explanations, or intermediate steps.`;

    const articleResponse = await llm.invoke([
      {
        role: "system",
        content: systemPrompt,
      },
      { role: "user", content: articlePrompt },
    ]);

    console.log("📄 Articles generated, parsing output...");

    // Handle potential tool calls in the response
    let finalContent: string;
    if (Array.isArray(articleResponse.content)) {
      // Response contains tool calls - extract the final text content
      console.log("🔧 Processing response with tool calls...");
      const textContent = articleResponse.content.find(
        (item: any) => item.type === "text"
      );
      finalContent = (textContent as any)?.text || "";

      // Log any tool calls that were made
      const toolCalls = articleResponse.content.filter(
        (item: any) => item.type === "tool_use"
      );
      if (toolCalls.length > 0) {
        console.log(`🔍 Agent 4a made ${toolCalls.length} tool call(s):`);
        toolCalls.forEach((call: any, index: number) => {
          console.log(
            `   ${index + 1}. Tool: ${call.name}, Input: ${JSON.stringify(call.input)}`
          );
        });
      }

      // If the text content is just tool usage explanation, try getting tool results
      if (
        finalContent &&
        finalContent.includes("I'll") &&
        finalContent.length < 200
      ) {
        console.log(
          "⚠️ Detected tool usage explanation instead of final output"
        );
        console.log("🔄 Retrying with explicit JSON requirement...");

        // Retry with a more explicit prompt
        const retryResponse = await baseLlm.invoke([
          {
            role: "system",
            content: `You are an expert article writer. Based on the provided research and evidence, generate articles in EXACTLY this JSON format. Do not explain your process or mention tools. Output ONLY valid JSON.`,
          },
          {
            role: "user",
            content:
              articlePrompt +
              "\n\nIMPORTANT: Respond with ONLY the JSON output. No explanations or tool mentions.",
          },
        ]);

        finalContent = retryResponse.content as string;
      }
    } else {
      // Standard string response
      finalContent = articleResponse.content as string;
    }

    // Parse the article output
    let articleOutput: ArticleOutput;
    try {
      const content = finalContent;
      console.log("\n📋 RAW ARTICLE OUTPUT:");
      console.log("=".repeat(80));
      console.log(content);
      console.log("=".repeat(80));

      articleOutput = await articleOutputParser.parse(content);
      console.log("✅ Article output parsed successfully");

      // Log detailed article information
      console.log("\n📰 GENERATED ARTICLES SUMMARY:");
      console.log("=".repeat(80));
      console.log(`Total Articles: ${articleOutput.articles.length}`);
      console.log(`Generation Strategy: ${articleOutput.generation_strategy}`);
      console.log(
        `Whitepaper Utilization: ${articleOutput.whitepaper_utilization}`
      );

      articleOutput.articles.forEach((article, index) => {
        console.log(`\n${"=".repeat(50)}`);
        console.log(`ARTICLE ${index + 1}`);
        console.log(`${"=".repeat(50)}`);
        console.log(`📰 Headline: ${article.headline}`);
        console.log(`📝 Subheadline: ${article.subheadline}`);
        console.log(`📊 Word Count: ${article.word_count}`);
        console.log(`🎯 Concept Used: ${article.concept_used}`);
        console.log(
          `🔍 Key Takeaways: ${Array.isArray(article.key_takeaways) ? article.key_takeaways.join(" | ") : "Not specified"}`
        );
        console.log(
          `🏷️ SEO Keywords: ${Array.isArray(article.seo_keywords) ? article.seo_keywords.join(", ") : "Not specified"}`
        );
        console.log(`📞 Call to Action: ${article.call_to_action}`);
        console.log(`\n📖 Article Body Preview (first 200 chars):`);
        console.log(`${article.body.substring(0, 200)}...`);
      });

      console.log("\n" + "=".repeat(80));
      console.log("🎉 ARTICLE GENERATION COMPLETE");
      console.log("=".repeat(80));
    } catch (parseError) {
      console.error("❌ Failed to parse article output:", parseError);
      console.log("\n🔍 RAW CONTENT THAT FAILED TO PARSE:");
      console.log("=".repeat(80));
      console.log(articleResponse.content);
      console.log("=".repeat(80));
      throw new Error("Failed to generate valid article output");
    }

    console.log(
      `✅ Agent 4a: Generated ${articleOutput.articles.length} article(s) successfully`
    );

    return {
      articleOutput,
      currentStep: "articles_generated",
      needsHumanInput: false, // Articles ready for next agents
    };
  } catch (error) {
    console.error("❌ Agent 4a Error:", error);
    throw new Error(
      `Article generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Helper function for additional Pinecone searches if needed
export async function searchWhitepaperForArticle(
  query: string,
  whitepaperConfig: { namespace: string; indexName: string }
): Promise<SearchResult[]> {
  try {
    console.log(`🔍 Searching whitepaper for: "${query}"`);

    const searchResults = await pineconeSearchTool.invoke({
      query,
      whitepaperNamespace: whitepaperConfig.namespace,
      indexName: whitepaperConfig.indexName,
      topK: 10,
      topN: 5,
    });

    // Handle string response (should be JSON)
    const results =
      typeof searchResults === "string"
        ? JSON.parse(searchResults)
        : searchResults;

    if (Array.isArray(results)) {
      return results.map((result: SearchResult) => ({
        id: result.id || "unknown",
        score: result.score || 0,
        text: result.text || "",
        category: result.category || "general",
      }));
    }

    return [];
  } catch (error) {
    console.error("❌ Whitepaper search failed:", error);
    return [];
  }
}
