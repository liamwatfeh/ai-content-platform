// Agent 4b: LinkedIn Post Writer
// Model: Claude Sonnet 4 (with thinking enabled)
// Purpose: Draft LinkedIn posts based on research and theme

import { ChatAnthropic } from "@langchain/anthropic";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import type {
  BasicWorkflowState,
  LinkedInOutput,
  ResearchDossier,
  MarketingBrief,
} from "../schemas/types";
import { LinkedInOutputSchema } from "../schemas/types";
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

// Create output parser for LinkedIn post generation
const linkedinOutputParser =
  StructuredOutputParser.fromZodSchema(LinkedInOutputSchema);

export async function linkedinWriterAgent(
  state: BasicWorkflowState
): Promise<Partial<BasicWorkflowState>> {
  console.log("💼 Agent 4b: Starting LinkedIn post generation...");

  try {
    // Validate inputs
    if (!state.marketingBrief) {
      throw new Error(
        "Marketing brief is required for LinkedIn post generation"
      );
    }

    if (!state.researchDossier) {
      throw new Error(
        "Research dossier is required for LinkedIn post generation"
      );
    }

    if (!state.selectedTheme) {
      throw new Error(
        "Selected theme is required for LinkedIn post generation"
      );
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
    const linkedinPostsCount = state.linkedinPostsCount || 4;

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

        // Get whitepaper title for context
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
      `💼 Generating ${linkedinPostsCount} LinkedIn post(s) using research dossier...`
    );

    // Create the LinkedIn post generation prompt (using Agent 1 output format)
    const linkedinPrompt = `MARKETING BRIEF:
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

LinkedIn posts to generate: ${linkedinPostsCount}
CTA Type: ${state.ctaType}${state.ctaUrl ? ` (URL: ${state.ctaUrl})` : ""}

${linkedinOutputParser.getFormatInstructions()}`;

    console.log(
      "🎯 Generating LinkedIn posts with guaranteed structured output..."
    );

    // Step 1: Optional research phase - determine if additional evidence is needed
    let researchResults = "";
    let toolUsageLog = "";

    const needsResearchPrompt = `Based on this research dossier, do you need additional specific evidence from "${whitepaperTitle}" to create compelling LinkedIn posts about "${state.selectedTheme.title}"?

RESEARCH DOSSIER SUMMARY:
Key Findings: ${researchDossier.whitepaperEvidence?.keyFindings?.map((f) => f.claim).join("; ") || "None"}
Suggested Concepts: ${researchDossier.suggestedConcepts?.map((c) => c.title).join("; ") || "None"}

Respond with "YES" if you need more specific statistics, case studies, or compelling examples. Respond with "NO" if the dossier provides sufficient evidence.`;

    const researchDecision = await baseLlm.invoke([
      {
        role: "system",
        content:
          "You are an expert research analyst. Respond with only YES or NO.",
      },
      { role: "user", content: needsResearchPrompt },
    ]);

    const needsResearch = researchDecision.content
      .toString()
      .trim()
      .toUpperCase()
      .includes("YES");

    if (needsResearch) {
      console.log("🔍 Agent 4b determined additional research is needed...");

      // Create research-focused LLM with tools
      const researchLlm = baseLlm.bindTools([pineconeSearchTool]);

      const researchPrompt = `You are a research assistant for LinkedIn content. Search "${whitepaperTitle}" for additional evidence to strengthen posts about "${state.selectedTheme.title}".

CURRENT RESEARCH GAPS:
Search for LinkedIn-optimized content:
1. Compelling statistics and metrics for hooks
2. Real-world success stories and case studies
3. Thought-provoking insights and quotes
4. Professional insights and industry trends

Make 1-3 focused searches to gather engaging evidence for LinkedIn posts.`;

      try {
        const researchResponse = await researchLlm.invoke([
          {
            role: "system",
            content:
              "Search for specific evidence to strengthen LinkedIn content. Use the search tool to find compelling data.",
          },
          { role: "user", content: researchPrompt },
        ]);

        // Extract and log tool results
        if (Array.isArray(researchResponse.content)) {
          const toolCalls = researchResponse.content.filter(
            (item: any) => item.type === "tool_use"
          );
          const textBlocks = researchResponse.content.filter(
            (item: any) => item.type === "text"
          );

          toolUsageLog = `Research phase: ${toolCalls.length} tool call(s) made`;
          console.log(`🔍 ${toolUsageLog}`);

          // Include research summary in final content
          researchResults =
            "\n\nADDITIONAL RESEARCH FINDINGS:\n" +
            toolCalls
              .map(
                (call: any, i: number) =>
                  `Research Query ${i + 1}: ${JSON.stringify(call.input)}`
              )
              .join("\n") +
            (textBlocks.length > 0
              ? `\nResearch Summary: ${(textBlocks[textBlocks.length - 1] as any)?.text || ""}`
              : "");
        }
      } catch (error) {
        console.log(
          "⚠️ Research phase encountered issue, proceeding with dossier only"
        );
        researchResults =
          "\n\nNote: Research phase encountered limitations, using research dossier evidence.";
      }
    } else {
      console.log(
        "✅ Agent 4b determined research dossier provides sufficient evidence"
      );
    }

    // Step 2: Generate structured content with GUARANTEED JSON output
    console.log(
      "📝 Generating LinkedIn posts with guaranteed structured output..."
    );

    const contentPrompt = `${linkedinPrompt}${researchResults}`;

    // Use withStructuredOutput for guaranteed JSON - no parsing needed!
    const structuredLlm = baseLlm.withStructuredOutput(
      linkedinOutputParser.schema
    );

    const linkedinOutput = await structuredLlm.invoke([
      {
        role: "system",
        content: `You are an expert LinkedIn content strategist specializing in B2B thought leadership. Create engaging, professional LinkedIn posts that drive meaningful engagement and achieve marketing objectives.

LINKEDIN CONTENT STRATEGY:
- Hook readers with compelling statistics or thought-provoking questions
- Provide valuable insights that establish thought leadership
- Include real-world examples and case studies for credibility
- Use professional yet conversational tone
- Structure with clear takeaways and actionable insights
- End with engaging calls-to-action that encourage discussion

POST REQUIREMENTS:
- Generate exactly ${linkedinPostsCount} LinkedIn post(s)
- Each post 150-300 words (LinkedIn optimal length)
- Include engaging hooks, valuable insights, and clear CTAs
- Vary post structures: insights, questions, stories, statistics
- Integrate evidence naturally from the research dossier${needsResearch ? " and additional research findings" : ""}
- Maintain professional credibility while driving engagement

${toolUsageLog ? `RESEARCH CONTEXT: ${toolUsageLog}` : ""}`,
      },
      {
        role: "user",
        content: contentPrompt,
      },
    ]);

    console.log(
      "💼 LinkedIn posts generated successfully with guaranteed structure!"
    );

    // Log detailed LinkedIn information
    console.log("\n📱 GENERATED LINKEDIN POSTS SUMMARY:");
    console.log("=".repeat(80));
    console.log(`Total Posts: ${linkedinOutput.posts.length}`);
    console.log(`Generation Strategy: ${linkedinOutput.generation_strategy}`);
    console.log(
      `Whitepaper Utilization: ${linkedinOutput.whitepaper_utilization}`
    );

    linkedinOutput.posts.forEach((post, index) => {
      console.log(`\n${"=".repeat(50)}`);
      console.log(`LINKEDIN POST ${index + 1}`);
      console.log(`${"=".repeat(50)}`);
      console.log(`📊 Character Count: ${post.character_count}`);
      console.log(`🎯 Concept Used: ${post.concept_used}`);
      console.log(`💡 Hook: ${post.hook}`);
      console.log(`📞 Call to Action: ${post.call_to_action}`);
      console.log(`\n📖 Body Preview (first 200 chars):`);
      console.log(`${post.body.substring(0, 200)}...`);
    });

    console.log("\n" + "=".repeat(80));
    console.log("🎉 LINKEDIN GENERATION COMPLETE");
    console.log("=".repeat(80));

    console.log(
      `✅ Agent 4b: Generated ${linkedinOutput.posts.length} LinkedIn post(s) successfully`
    );

    return {
      linkedinOutput,
      currentStep: "linkedin_posts_generated",
    };
  } catch (error) {
    console.error("❌ Agent 4b Error:", error);
    throw new Error(
      `LinkedIn post generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Helper function for searching whitepaper content for LinkedIn posts
export async function searchWhitepaperForLinkedIn(
  query: string,
  whitepaperConfig: { namespace: string; indexName: string }
): Promise<SearchResult[]> {
  try {
    console.log(
      `🔍 Searching whitepaper: "${query}" in namespace: ${whitepaperConfig.namespace}`
    );

    const searchResults = await pineconeSearchTool.invoke({
      query,
      whitepaperNamespace: whitepaperConfig.namespace,
      indexName: whitepaperConfig.indexName,
      // ORIGINAL CODE (BACKED UP): topK: 10,
      topK: 5, // Reduced for faster testing
      topN: 5,
    });

    // Handle both string and object responses
    if (typeof searchResults === "string") {
      try {
        const parsed = JSON.parse(searchResults);
        return parsed.results || parsed || [];
      } catch {
        return [];
      }
    }

    return (searchResults as any)?.results || [];
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}
