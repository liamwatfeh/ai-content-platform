// Agent 5c: Social Media Editor
// Model: Claude Sonnet 4 (with thinking enabled)
// Purpose: Proofread and edit social media post drafts

import { ChatAnthropic } from "@langchain/anthropic";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import type {
  BasicWorkflowState,
  SocialOutput,
  MarketingBrief,
} from "../schemas/types";
import { EditedSocialOutputSchema } from "../schemas/types";

// Initialize Claude Sonnet 4 with thinking enabled
const llm = new ChatAnthropic({
  modelName: "claude-sonnet-4-20250514",
  temperature: 0.3,
  maxTokens: 4000,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

// Create output parser for edited social posts
const editedSocialOutputParser = StructuredOutputParser.fromZodSchema(
  EditedSocialOutputSchema
);

export async function socialEditorAgent(
  state: BasicWorkflowState
): Promise<Partial<BasicWorkflowState>> {
  console.log("📱 Agent 5c: Starting social media post editing...");

  try {
    // Validate inputs
    if (!state.marketingBrief) {
      throw new Error("Marketing brief is required for social editing");
    }

    if (!state.socialOutput) {
      throw new Error("Social output is required for editing");
    }

    const marketingBrief = JSON.parse(state.marketingBrief) as MarketingBrief;
    const socialOutput = state.socialOutput as SocialOutput;

    console.log(
      `📱 Editing ${socialOutput.posts.length} social media post(s)...`
    );

    // Create the social editing prompt
    const editingPrompt = `MARKETING BRIEF:
Business: ${marketingBrief.business_overview}
Audience: ${marketingBrief.target_audience_analysis}
Objectives: ${marketingBrief.marketing_objectives}
Key Messages: ${marketingBrief.key_messages.join(" | ")}
Tone: ${marketingBrief.tone_and_voice}

SOCIAL MEDIA POSTS TO EDIT:
${socialOutput.posts
  .map(
    (post, i) => `
SOCIAL POST ${i + 1}:
Platform: ${post.platform}
Content: ${post.content}
Character Count: ${post.character_count}
Visual Suggestion: ${post.visual_suggestion}
Concept Used: ${post.concept_used}
`
  )
  .join("\n")}

${editedSocialOutputParser.getFormatInstructions()}`;

    console.log("🎯 Editing social media posts with Claude Sonnet 4...");

    // Generate edited social posts using Claude
    const systemPrompt = `You are a professional social media editor who specializes in creating viral, engaging content. Review and edit social media post drafts to maximize reach, engagement, and shareability.

EDITING FOCUS:
- Platform-specific optimization (Twitter/X, Facebook, Instagram)
- Character limits and formatting constraints (50 words MAX)
- Visual content suggestions that enhance posts
- Engagement hooks and compelling calls-to-action
- Brand voice consistency across platforms
- Shareability and viral potential
- Accessibility considerations
- Timing and posting strategy optimization

SOCIAL MEDIA OPTIMIZATION:
- No hashtags (rely on compelling content)
- Strong hooks that stop the scroll
- Power words and emotional triggers
- Conversational and authentic language
- Platform-specific best practices
- Visual storytelling integration
- Community engagement focus

PLATFORM SPECIFICS:
- Twitter/X: Sharp, quotable insights (under 50 words)
- Facebook: Conversational, community-building tone (under 50 words)
- Instagram: Visual storytelling focus with inspiring angles (under 50 words)

EDITING PRINCIPLES:
- Enhance viral potential without losing authenticity
- Ensure posts work independently and as part of campaign
- Maintain brand consistency
- Improve engagement triggers
- Strengthen visual content integration
- Optimize for shareability

Provide edited social posts that maximize engagement while achieving marketing objectives.`;

    const editorResponse = await llm.invoke([
      {
        role: "system",
        content: systemPrompt,
      },
      { role: "user", content: editingPrompt },
    ]);

    console.log("📱 Social media editing completed, parsing output...");

    // Parse the edited social output
    const editedSocialOutput = await editedSocialOutputParser.parse(
      editorResponse.content as string
    );

    console.log(
      `✅ Agent 5c: Edited ${editedSocialOutput.posts.length} social media post(s) successfully`
    );
    console.log(`📊 Quality Score: ${editedSocialOutput.quality_score}/10`);
    console.log(`📝 Editing Notes: ${editedSocialOutput.editing_notes}`);

    return {
      editedSocialOutput,
      currentStep: "social_edited",
      needsHumanInput: false,
    };
  } catch (error) {
    console.error("❌ Agent 5c Error:", error);
    throw new Error(
      `Social media editing failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Legacy export for backward compatibility (keeping the old pattern)
export const SocialEditorAgent = {
  name: "social-editor",
  model: "claude-sonnet-4-20250514",
  systemPrompt: `You are a professional social media editor who specializes in viral, engaging content. Review and edit social media post drafts to maximize engagement.

Focus on:
- Platform-specific optimization (Twitter/X, Facebook, Instagram)
- Character limits and formatting constraints
- Visual content suggestions
- Engagement hooks and call-to-actions
- Brand voice consistency
- Accessibility considerations
- Timing and posting strategy recommendations

Ensure each post maximizes engagement potential while staying true to the campaign theme.`,

  userPromptTemplate: `Marketing brief: {marketing_brief}
Social posts draft: {social_draft}`,

  tools: ["output-parser"],
};

export type SocialEditorAgentType = typeof SocialEditorAgent;
