// Agent 4b: LinkedIn Post Writer
// Model: Claude Sonnet 4 (with thinking enabled)
// Purpose: Draft LinkedIn posts based on research and theme

import { z } from "zod";
import { ChatAnthropic } from "@langchain/anthropic";

export const LinkedInWriterAgent = {
  name: "linkedin-writer",
  model: "claude-3-5-sonnet-20241022", // Using Claude Sonnet 4 with thinking
  systemPrompt: `Draft {number_of_linkedin_posts} LinkedIn posts for this specific company.

The research has already been done for you. Write LinkedIn posts that are:
- Professional yet engaging
- Optimized for LinkedIn's algorithm
- Include relevant hashtags
- Have clear calls-to-action
- Use storytelling when appropriate
- Focus on thought leadership and industry insights

Each post should be standalone but part of a cohesive campaign. You have access to the Pinecone vector store tool if you need additional info from the whitepaper.`,

  userPromptTemplate: `
Marketing brief: {marketing_brief}
Research findings: {research}
Theme: {theme}
Number of posts requested: {number_of_linkedin_posts}
`,

  // Tools: Output parser, Pinecone search, Think tool
  tools: ["output-parser", "pinecone-search", "think-tool"],
};

// Export type for the agent
export type LinkedInWriterAgentType = typeof LinkedInWriterAgent;
