// Agent 5a: Article Editor
// Model: Claude Sonnet 4 (with thinking enabled)
// Purpose: Proofread and edit article drafts using Economist style guide

import { z } from "zod";
import { ChatAnthropic } from "@langchain/anthropic";

export const ArticleEditorAgent = {
  name: "article-editor",
  model: "claude-3-5-sonnet-20241022", // Using Claude Sonnet 4 with thinking
  systemPrompt: `Proofread this article draft and edit it to make it better. Use The Economist style guide.

Focus on:
- Grammar and spelling accuracy
- Clarity and readability
- Logical flow and structure
- Fact-checking consistency with the marketing brief
- Tone and voice alignment
- Compelling headlines and subheadings
- Strong opening and closing
- Call-to-action effectiveness

Provide the edited version with clear improvements while maintaining the original intent and key messages.`,

  userPromptTemplate: `
Marketing brief: {marketing_brief}
Article draft: {article_draft}
`,

  // Tools: Output parser, Think tool
  tools: ["output-parser", "think-tool"],
};

// Export type for the agent
export type ArticleEditorAgentType = typeof ArticleEditorAgent;
