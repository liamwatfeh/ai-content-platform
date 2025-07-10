// Agent 4c: Social Media Writer
// Model: Claude Sonnet 4 (with thinking enabled)
// Purpose: Draft short, punchy social media posts based on research and theme

import { ChatAnthropic } from "@langchain/anthropic";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import type {
  BasicWorkflowState,
  SocialOutput,
  ResearchDossier,
  MarketingBrief,
} from "../schemas/types";
import { SocialOutputSchema } from "../schemas/types";
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

// Create output parser for social media post generation
const socialOutputParser =
  StructuredOutputParser.fromZodSchema(SocialOutputSchema);

export async function socialWriterAgent(
  state: BasicWorkflowState
): Promise<Partial<BasicWorkflowState>> {
  console.log("📱 Agent 4c: Starting social media post generation...");

  try {
    // Validate inputs
    if (!state.marketingBrief) {
      throw new Error(
        "Marketing brief is required for social media post generation"
      );
    }

    if (!state.researchDossier) {
      throw new Error(
        "Research dossier is required for social media post generation"
      );
    }

    if (!state.selectedTheme) {
      throw new Error(
        "Selected theme is required for social media post generation"
      );
    }

    const marketingBrief = JSON.parse(state.marketingBrief) as MarketingBrief;
    const researchDossier = state.researchDossier as ResearchDossier;
    const socialPostsCount = state.socialPostsCount || 8;

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
      `📱 Generating ${socialPostsCount} social media post(s) using research dossier...`
    );

    // Create the social media post generation prompt
    const socialPrompt = `MARKETING BRIEF:
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

Social media posts to generate: ${socialPostsCount}
CTA Type: ${state.ctaType}${state.ctaUrl ? ` (URL: ${state.ctaUrl})` : ""}

${socialOutputParser.getFormatInstructions()}`;

    console.log("🎯 Generating social media posts with Claude Sonnet 4...");

    // Generate social media posts using Claude with tool access
    const systemPrompt = `You are an expert social media strategist who creates viral, engaging content that drives massive engagement. Your posts consistently perform in the top 1% for reach and engagement.

AVAILABLE TOOL:
You have access to a Pinecone search tool that can search through "${whitepaperTitle}" if you need additional evidence, specific quotes, or deeper details beyond what's provided in the research dossier.

The tool searches through the whitepaper content and returns relevant passages. Use it strategically when:
- You need specific statistics for impactful social proof
- You want to find quotable insights or data points
- You need to verify claims for credibility
- You want additional context for viral content angles

TOOL USAGE GUIDELINES:
- Use short, focused search queries (2-6 words) for best results
- Examples: "ROI statistics", "success metrics", "breakthrough results"
- Only search if you need specific data beyond the provided research
- Focus on finding shareable, quotable insights

SOCIAL MEDIA POST REQUIREMENTS:
- Generate exactly the specified number of social media posts
- Mix of platforms: Twitter/X, Facebook, Instagram
- Each post should be 50 words MAX (approximately 250-300 characters)
- No hashtags - focus on natural, engaging language
- Create scroll-stopping content that drives immediate engagement
- Use compelling one-liners, insights, or thought-provoking statements
- Integrate key research insights naturally
- Each post should use a different suggested concept when possible
- Include visual suggestions that complement the content
- Optimize for virality and shareability

SOCIAL MEDIA POST STYLES:
- Twitter/X: Sharp insights, quick takes, thought-provoking questions (under 50 words)
- Facebook: Conversational, community-focused but still concise (under 50 words)
- Instagram: Visual-first thinking, inspirational but punchy (under 50 words)

PLATFORM DISTRIBUTION:
- Aim for roughly equal distribution across the three platforms
- Keep ALL posts under 50 words regardless of platform
- Consider visual elements that would enhance each post

SOCIAL MEDIA BEST PRACTICES:
- NO hashtags - rely on compelling content, not tags
- Lead with strong hooks that stop the scroll
- Use power words and emotional triggers
- Keep language conversational and authentic
- Create content that begs to be shared
- Include specific, concrete details when possible
- End with implicit calls-to-action through curiosity or questions
- Consider how each post would look with accompanying visuals

PLATFORM-SPECIFIC OPTIMIZATION:
- Twitter/X: Sharp, quotable insights. Maximum impact in minimum words (under 50 words).
- Facebook: Conversational, community-building tone but still concise (under 50 words)
- Instagram: Visual storytelling focus with inspiring or aspirational angles (under 50 words)

Focus on creating content that achieves marketing objectives while being genuinely shareable and valuable to the audience.`;

    const socialResponse = await llm.invoke([
      {
        role: "system",
        content: systemPrompt,
      },
      { role: "user", content: socialPrompt },
    ]);

    console.log("📱 Social media posts generated, parsing output...");

    // Handle potential tool calls in the response
    let finalContent: string;
    if (Array.isArray(socialResponse.content)) {
      // Response contains tool calls - extract the final text content
      console.log("🔧 Processing response with tool calls...");
      const textContent = socialResponse.content.find(
        (item: any) => item.type === "text"
      );
      // @ts-ignore - Tool response content handling
      finalContent = textContent?.text || "";
    } else {
      // Simple text response
      finalContent = socialResponse.content;
    }

    if (!finalContent) {
      throw new Error("No valid content received from social media generation");
    }

    console.log("🔍 Parsing social media output...");

    // Parse the social media posts output
    const socialOutput = await socialOutputParser.parse(finalContent);

    console.log(
      `✅ Agent 4c: Generated ${socialOutput.posts.length} social media post(s) successfully`
    );

    // Log individual posts for debugging
    socialOutput.posts.forEach((post, index) => {
      console.log(`📱 Social Post ${index + 1}:`);
      console.log(`  Platform: ${post.platform}`);
      console.log(`  Content: ${post.content.substring(0, 100)}...`);
      console.log(`  Characters: ${post.character_count}`);
      console.log(`  Concept: ${post.concept_used}`);
    });

    return {
      socialOutput,
      currentStep: "social_posts_generated",
    };
  } catch (error) {
    console.error("❌ Agent 4c Error:", error);
    throw new Error(
      `Social media post generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Helper function for searching whitepaper content for social media posts
export async function searchWhitepaperForSocial(
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
