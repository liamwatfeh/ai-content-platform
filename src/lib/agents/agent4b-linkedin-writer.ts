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

    const marketingBrief = JSON.parse(state.marketingBrief) as MarketingBrief;
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

    // Create the LinkedIn post generation prompt
    const linkedinPrompt = `MARKETING BRIEF:
Business: ${marketingBrief.business_overview}
Audience: ${marketingBrief.target_audience_analysis}
Objectives: ${marketingBrief.marketing_objectives}
Key Messages: ${Array.isArray(marketingBrief.key_messages) ? marketingBrief.key_messages.join(" | ") : marketingBrief.key_messages || "Not specified"}
Tone: ${marketingBrief.tone_and_voice}
Positioning: ${marketingBrief.competitive_positioning}

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

    console.log("🎯 Generating LinkedIn posts with Claude Sonnet 4...");

    // Generate LinkedIn posts using Claude with tool access
    const systemPrompt = `You are an expert LinkedIn content strategist specializing in B2B thought leadership. Create engaging, professional LinkedIn posts that drive meaningful engagement and achieve marketing objectives.

AVAILABLE TOOL:
You have access to a Pinecone search tool that can search through "${whitepaperTitle}" if you need additional evidence, specific quotes, or deeper details beyond what's provided in the research dossier.

The tool searches through the whitepaper content and returns relevant passages. Use it strategically when:
- You need specific statistics or data points not in the research dossier
- You want to find compelling quotes or examples for social proof
- You need to verify or expand on evidence claims
- You want additional context for specific concepts

TOOL USAGE GUIDELINES:
- Use short, focused search queries (2-6 words) for best results
- Examples: "ROI statistics", "case study results", "implementation challenges"
- Only search if you genuinely need additional evidence beyond the provided research
- The research dossier already contains comprehensive findings, so use the tool judiciously

LINKEDIN POST REQUIREMENTS:
- Generate exactly the specified number of LinkedIn posts
- Each post should be 50-150 words (approximately 300-900 characters)
- No hashtags - focus on natural, conversational tone
- Include compelling hooks to grab attention
- Use storytelling and thought leadership approaches
- Integrate whitepaper evidence naturally
- Each post should use a different suggested concept if multiple posts requested
- Include clear call-to-action for engagement
- Optimize for LinkedIn algorithm (questions, insights, personal experiences)

LINKEDIN POST STRUCTURE:
- Hook: Attention-grabbing opening line
- Body: Main content with insights, stories, or actionable advice
- Call-to-action: Question or engagement prompt

LINKEDIN BEST PRACTICES:
- NO hashtags - focus on natural, conversational language
- Start with compelling hooks that stop the scroll
- Use personal insights and experiences when relevant
- Ask thought-provoking questions to drive engagement
- Keep posts between 50-150 words (300-900 characters) for optimal engagement
- Use line breaks for readability
- End with clear calls-to-action that invite conversation

Focus on creating posts that establish thought leadership while achieving the marketing objectives.`;

    const linkedinResponse = await llm.invoke([
      {
        role: "system",
        content: systemPrompt,
      },
      { role: "user", content: linkedinPrompt },
    ]);

    console.log("💼 LinkedIn posts generated, parsing output...");

    // Handle potential tool calls in the response
    let finalContent: string;
    if (Array.isArray(linkedinResponse.content)) {
      // Response contains tool calls - extract the final text content
      console.log("🔧 Processing response with tool calls...");
      const textContent = linkedinResponse.content.find(
        (item: any) => item.type === "text"
      );
      // @ts-ignore - Tool response content handling
      finalContent = textContent?.text || "";
    } else {
      // Simple text response
      finalContent = linkedinResponse.content;
    }

    if (!finalContent) {
      throw new Error("No valid content received from LinkedIn generation");
    }

    console.log("🔍 Parsing LinkedIn output...");

    // Parse the LinkedIn posts output
    const linkedinOutput = await linkedinOutputParser.parse(finalContent);

    console.log(
      `✅ Agent 4b: Generated ${linkedinOutput.posts.length} LinkedIn post(s) successfully`
    );

    // Log individual posts for debugging
    linkedinOutput.posts.forEach((post, index) => {
      console.log(`📝 LinkedIn Post ${index + 1}:`);
      console.log(`  Hook: ${post.hook.substring(0, 100)}...`);
      console.log(`  Characters: ${post.character_count}`);
      console.log(`  Concept: ${post.concept_used}`);
    });

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
      topK: 10,
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
