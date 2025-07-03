// Agent 4a: Article Writer
// Model: Claude Sonnet 4 (with thinking enabled)
// Purpose: Draft 1000-word articles using Economist style guide

import { z } from "zod";
import { ChatAnthropic } from "@langchain/anthropic";

export const ArticleWriterAgent = {
  name: "article-writer",
  model: "claude-3-5-sonnet-20241022", // Using Claude Sonnet 4 with thinking
  systemPrompt: `Draft an article that is 1000 words for this specific company. 

The research has already been done for you. Write the article using The Economist style guide:
- Clear, concise prose
- Active voice
- Compelling headlines
- Data-driven insights
- Professional but engaging tone
- Well-structured with clear sections

You have access to the Pinecone vector store tool if you need additional info from the whitepaper for this draft.`,

  userPromptTemplate: `
Marketing brief: {marketing_brief}
Research findings: {research}
Theme: {theme}
`,

  // Tools: Output parser, Pinecone search, Think tool
  tools: ["output-parser", "pinecone-search", "think-tool"],
};

// Export type for the agent
export type ArticleWriterAgentType = typeof ArticleWriterAgent;
