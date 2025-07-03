// Agent 3: Deep Researcher
// Model: o3-2025-04-16 or Claude Sonnet 4 (with thinking enabled)
// Purpose: Do deep research on the approved theme using Pinecone search

import { z } from "zod";
import { ChatAnthropic } from "@langchain/anthropic";

export const ResearcherAgent = {
  name: "researcher",
  model: "claude-3-5-sonnet-20241022", // Using Claude Sonnet 4 with thinking
  systemPrompt: `Based on the user's approved theme, do some deep research using the Pinecone tool on this particular idea.

Extract lots of details around this key theme from the whitepaper content. Focus on:
- Supporting data and statistics
- Technical details relevant to the theme
- Use cases and examples
- Industry insights
- Competitive advantages

Provide comprehensive research that will inform high-quality content creation.`,

  userPromptTemplate: `Theme: {approved_theme}`,

  // Tools: Output parser, Pinecone search, Think tool
  tools: ["output-parser", "pinecone-search", "think-tool"],
};

// Export type for the agent
export type ResearcherAgentType = typeof ResearcherAgent;
