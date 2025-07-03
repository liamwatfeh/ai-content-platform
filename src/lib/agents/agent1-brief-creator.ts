// Agent 1: Brief Creator
// Model: o3-2025-04-16
// Purpose: Generate a detailed marketing brief optimized for LLM consumption

import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { BasicWorkflowState } from "../schemas/types";

// Simplified schema for Agent 1's output
const MarketingBriefOutputSchema = z.object({
  executiveSummary: z.string(),
  targetPersona: z.object({
    demographic: z.string(),
    psychographic: z.string(),
    painPoints: z.array(z.string()),
    motivations: z.array(z.string()),
  }),
  campaignObjectives: z.array(z.string()),
  keyMessages: z.array(z.string()),
  contentStrategy: z.object({
    articles: z.number(),
    linkedinPosts: z.number(),
    socialPosts: z.number(),
  }),
  callToAction: z.object({
    type: z.string(),
    message: z.string(),
    url: z.string().optional(),
  }),
});

export async function briefCreatorAgent(
  state: BasicWorkflowState
): Promise<Partial<BasicWorkflowState>> {
  console.log("🤖 Agent 1: Brief Creator starting...");

  try {
    // Initialize OpenAI with GPT-4 (supports temperature)
    const llm = new ChatOpenAI({
      model: "gpt-4", // Use GPT-4 which supports temperature
      temperature: 0.7,
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Simplified system prompt
    const systemPrompt = `You are a marketing brief creation expert. Generate a detailed marketing brief from the user's input that is optimized for an LLM to read and understand.

Transform the raw user input into a comprehensive, structured marketing brief that includes:
- Executive summary of the campaign
- Detailed target persona analysis
- Clear campaign objectives
- Key messages to communicate
- Content strategy aligned with output requirements
- Call-to-action strategy

Make the brief detailed, specific, and actionable. Focus on clarity and completeness.

Return your response as a JSON object matching this exact structure:
{
  "executiveSummary": "string",
  "targetPersona": {
    "demographic": "string",
    "psychographic": "string", 
    "painPoints": ["string"],
    "motivations": ["string"]
  },
  "campaignObjectives": ["string"],
  "keyMessages": ["string"],
  "contentStrategy": {
    "articles": number,
    "linkedinPosts": number,
    "socialPosts": number
  },
  "callToAction": {
    "type": "string",
    "message": "string",
    "url": "string (optional)"
  }
}`;

    // User prompt with actual data
    const userPrompt = `Create a marketing brief from this information:

Business Context: ${state.businessContext}
Target Audience: ${state.targetAudience}
Marketing Goals: ${state.marketingGoals}
Content Requirements: ${state.articlesCount} articles, ${state.linkedinPostsCount} LinkedIn posts, ${state.socialPostsCount} social posts
CTA Type: ${state.ctaType}
${state.ctaUrl ? `CTA URL: ${state.ctaUrl}` : ""}`;

    // Call LLM
    const response = await llm.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    // Parse and validate response
    const briefData = JSON.parse(response.content as string);
    const validatedBrief = MarketingBriefOutputSchema.parse(briefData);
    const marketingBrief = JSON.stringify(validatedBrief, null, 2);

    console.log("✅ Agent 1: Brief created successfully");

    return {
      marketingBrief,
      currentStep: "brief_complete",
      isComplete: true,
    };
  } catch (error) {
    console.error("❌ Agent 1 Error:", error);
    throw new Error(
      `Brief creation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Legacy export for backward compatibility with existing workflow
export const BriefCreatorAgent = {
  name: "brief-creator",
  model: "o3-2025-04-16", // Will use o3-2025-04-16 when available
  systemPrompt: `You are a marketing brief creation expert. Generate a detailed marketing brief from the user's input that is optimized for an LLM to read and understand.

Transform the raw user input into a comprehensive, structured marketing brief that includes:
- Executive summary of the campaign
- Detailed target persona analysis
- Clear campaign objectives
- Key messages to communicate
- Content strategy aligned with output requirements
- Call-to-action strategy

Make the brief detailed, specific, and actionable. Focus on clarity and completeness.`,
  
  userPromptTemplate: `Create a marketing brief from this information:

Business Context: {business_context}
Target Audience: {target_audience}
Marketing Goals: {marketing_goals}
Content Requirements: {articles} articles, {linkedin_posts} LinkedIn posts, {social_posts} social posts
CTA Type: {cta_type}
{cta_url}`,

  // Tools: Output parser with schema
  tools: ["output-parser"],
};

// Export the schema for use in other parts of the system
export { MarketingBriefOutputSchema };
export type MarketingBriefOutput = z.infer<typeof MarketingBriefOutputSchema>;
