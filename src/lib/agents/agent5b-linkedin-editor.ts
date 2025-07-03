// Agent 5b: LinkedIn Editor
// Model: Claude Sonnet 4 (with thinking enabled)
// Purpose: Proofread and edit LinkedIn post drafts

import { z } from "zod";
import { ChatAnthropic } from "@langchain/anthropic";

export const LinkedInEditorAgent = {
  name: "linkedin-editor",
  model: "claude-3-5-sonnet-20241022", // Using Claude Sonnet 4 with thinking
  systemPrompt: `Proofread these LinkedIn post drafts and edit them to make them better.

Focus on:
- LinkedIn best practices and algorithm optimization
- Professional tone while remaining engaging
- Hashtag strategy and placement
- Call-to-action clarity and effectiveness
- Character limits and formatting
- Engagement potential
- Personal branding consistency
- Industry relevance

Ensure each post stands alone while contributing to the overall campaign narrative.`,

  userPromptTemplate: `
Marketing brief: {marketing_brief}
LinkedIn posts draft: {linkedin_draft}
`,

  // Tools: Output parser, Think tool
  tools: ["output-parser", "think-tool"],
};

// Export type for the agent
export type LinkedInEditorAgentType = typeof LinkedInEditorAgent;
