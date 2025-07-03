// Agent 5c: Social Media Editor
// Model: Claude Sonnet 4 (with thinking enabled)
// Purpose: Proofread and edit social media post drafts

import { z } from "zod";
import { ChatAnthropic } from "@langchain/anthropic";

export const SocialEditorAgent = {
  name: "social-editor",
  model: "claude-3-5-sonnet-20241022", // Using Claude Sonnet 4 with thinking
  systemPrompt: `Proofread these social media post drafts and edit them to make them better.

Focus on:
- Platform-specific optimization (Twitter/X, Facebook, Instagram)
- Character limits and formatting constraints
- Hashtag strategy and trending topics
- Visual content suggestions
- Engagement hooks and call-to-actions
- Brand voice consistency
- Accessibility considerations
- Timing and posting strategy recommendations

Ensure each post maximizes engagement potential while staying true to the campaign theme.`,

  userPromptTemplate: `
Marketing brief: {marketing_brief}
Social posts draft: {social_draft}
`,

  // Tools: Output parser, Think tool
  tools: ["output-parser", "think-tool"],
};

// Export type for the agent
export type SocialEditorAgentType = typeof SocialEditorAgent;
