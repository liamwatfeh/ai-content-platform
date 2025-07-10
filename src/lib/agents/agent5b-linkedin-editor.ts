// Agent 5b: LinkedIn Editor
// Model: Claude Sonnet 4 (with thinking enabled)
// Purpose: Proofread and edit LinkedIn post drafts

import { ChatAnthropic } from "@langchain/anthropic";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import type {
  BasicWorkflowState,
  LinkedInOutput,
  MarketingBrief,
} from "../schemas/types";
import { EditedLinkedInOutputSchema } from "../schemas/types";

// Initialize Claude Sonnet 4 with thinking enabled
const llm = new ChatAnthropic({
  modelName: "claude-sonnet-4-20250514",
  temperature: 0.3,
  maxTokens: 4000,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

// Create output parser for edited LinkedIn posts
const editedLinkedInOutputParser = StructuredOutputParser.fromZodSchema(
  EditedLinkedInOutputSchema
);

export async function linkedinEditorAgent(
  state: BasicWorkflowState
): Promise<Partial<BasicWorkflowState>> {
  console.log("💼 Agent 5b: Starting LinkedIn post editing...");

  try {
    // Validate inputs
    if (!state.marketingBrief) {
      throw new Error("Marketing brief is required for LinkedIn editing");
    }

    if (!state.linkedinOutput) {
      throw new Error("LinkedIn output is required for editing");
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

    const linkedinOutput = state.linkedinOutput as LinkedInOutput;

    console.log(
      `💼 Editing ${linkedinOutput.posts.length} LinkedIn post(s)...`
    );

    // Create the LinkedIn editing prompt (using Agent 1 output format)
    const editingPrompt = `MARKETING BRIEF:
Executive Summary: ${marketingBrief.executiveSummary || "Not provided"}
Target Persona: ${JSON.stringify(marketingBrief.targetPersona || {})}
Campaign Objectives: ${JSON.stringify(marketingBrief.campaignObjectives || [])}
Key Messages: ${JSON.stringify(marketingBrief.keyMessages || [])}
Call to Action: ${marketingBrief.callToAction || "Not specified"}

LINKEDIN POSTS TO EDIT:
${linkedinOutput.posts
  .map(
    (post, i) => `
LINKEDIN POST ${i + 1}:
Hook: ${post.hook}
Body: ${post.body}
Call to Action: ${post.call_to_action}
Character Count: ${post.character_count}
Concept Used: ${post.concept_used}
`
  )
  .join("\n")}

${editedLinkedInOutputParser.getFormatInstructions()}`;

    console.log("🎯 Editing LinkedIn posts with Claude Sonnet 4...");

    // Generate edited LinkedIn posts using Claude
    const systemPrompt = `You are a professional LinkedIn content editor specializing in B2B thought leadership. Review and edit LinkedIn post drafts to maximize engagement and professional impact.

EDITING FOCUS:
- LinkedIn best practices and algorithm optimization
- Professional tone while remaining engaging and authentic
- Character limits and formatting for readability
- Call-to-action clarity and effectiveness
- Engagement potential optimization
- Personal branding consistency
- Industry relevance and timeliness
- Line breaks and visual formatting

LINKEDIN OPTIMIZATION:
- No hashtags (focus on natural language)
- Strong hooks that stop the scroll
- Thought-provoking questions for engagement
- Personal insights and experiences
- Optimal length (50-150 words / 300-900 characters)
- Clear value proposition for readers

EDITING PRINCIPLES:
- Enhance engagement potential without losing authenticity
- Ensure each post stands alone while contributing to campaign narrative
- Maintain professional credibility
- Improve readability and flow
- Strengthen calls-to-action for meaningful interactions

Provide edited LinkedIn posts with enhanced engagement potential and professional polish.`;

    const editorResponse = await llm.invoke([
      {
        role: "system",
        content: systemPrompt,
      },
      { role: "user", content: editingPrompt },
    ]);

    console.log("💼 LinkedIn editing completed, parsing output...");

    // Parse the edited LinkedIn output
    const editedLinkedInOutput = await editedLinkedInOutputParser.parse(
      editorResponse.content as string
    );

    console.log(
      `✅ Agent 5b: Edited ${editedLinkedInOutput.posts.length} LinkedIn post(s) successfully`
    );
    console.log(`📊 Quality Score: ${editedLinkedInOutput.quality_score}/10`);
    console.log(`📝 Editing Notes: ${editedLinkedInOutput.editing_notes}`);

    return {
      editedLinkedInOutput,
      currentStep: "linkedin_edited",
      needsHumanInput: false,
    };
  } catch (error) {
    console.error("❌ Agent 5b Error:", error);
    throw new Error(
      `LinkedIn editing failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Legacy export for backward compatibility (keeping the old pattern)
export const LinkedInEditorAgent = {
  name: "linkedin-editor",
  model: "claude-sonnet-4-20250514",
  systemPrompt: `You are a professional LinkedIn content editor. Review and edit LinkedIn post drafts to maximize engagement and professional impact.

Focus on:
- LinkedIn best practices and algorithm optimization
- Professional tone while remaining engaging
- Character limits and formatting
- Call-to-action clarity and effectiveness
- Engagement potential
- Personal branding consistency
- Industry relevance

Ensure each post stands alone while contributing to the overall campaign narrative.`,

  userPromptTemplate: `Marketing brief: {marketing_brief}
LinkedIn posts draft: {linkedin_draft}`,

  tools: ["output-parser"],
};

export type LinkedInEditorAgentType = typeof LinkedInEditorAgent;
