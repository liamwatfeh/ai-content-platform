// Agent 4c: Social Media Writer
// Model: Claude Sonnet 4 (with thinking enabled)
// Purpose: Draft social media posts based on research and theme

import { z } from "zod";
import { ChatAnthropic } from "@langchain/anthropic";

export const SocialWriterAgent = {
  name: "social-writer",
  model: "claude-3-5-sonnet-20241022", // Using Claude Sonnet 4 with thinking
  systemPrompt: `Draft {number_of_social_posts} social media posts for this specific company.

The research has already been done for you. Write social posts that are:
- Concise and impactful
- Platform-appropriate (Twitter/X, Facebook, Instagram)
- Include relevant hashtags and mentions
- Have strong visual elements in mind
- Encourage engagement (likes, shares, comments)
- Drive traffic to the main content

Each post should work independently while supporting the overall campaign theme. You have access to the Pinecone vector store tool if you need additional info from the whitepaper.`,

  userPromptTemplate: `
Marketing brief: {marketing_brief}
Research findings: {research}
Theme: {theme}
Number of posts requested: {number_of_social_posts}
`,

  // Tools: Output parser, Pinecone search, Think tool
  tools: ["output-parser", "pinecone-search", "think-tool"],
};

// Export type for the agent
export type SocialWriterAgentType = typeof SocialWriterAgent;
