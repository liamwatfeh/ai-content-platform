// Types and Schemas for LangGraph Agent System - Updated for Frontend
import { z } from "zod";
import { Annotation } from "@langchain/langgraph";

// Add theme schema
const ThemeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  whyItWorks: z.array(z.string()).length(3),
  detailedDescription: z.string().describe("Hidden field for next agent"),
});

// Updated workflow state with Agent 2 fields
export const BasicWorkflowState = z.object({
  // User inputs from the form
  businessContext: z.string().describe("Your business context field"),
  targetAudience: z.string().describe("Who is your target audience field"),
  marketingGoals: z.string().describe("What are your marketing goals field"),

  // Content output preferences
  articlesCount: z.number().default(1),
  linkedinPostsCount: z.number().default(4),
  socialPostsCount: z.number().default(8),

  // Call-to-action configuration
  ctaType: z.enum(["download_whitepaper", "contact_us"]),
  ctaUrl: z.string().optional().describe("URL for whitepaper download"),

  // Selected whitepaper for processing
  selectedWhitepaperId: z
    .string()
    .optional()
    .describe("ID of the selected whitepaper"),

  // Agent 1 output - the generated marketing brief
  marketingBrief: z.string().optional(),

  // Agent 2 outputs and memory
  generatedThemes: z.array(ThemeSchema).optional(),
  previousThemes: z
    .array(ThemeSchema)
    .default([])
    .describe("Memory of previous themes to avoid repeating"),
  searchHistory: z
    .array(z.string())
    .default([])
    .describe("Track search queries used"),
  regenerationCount: z.number().default(0),

  // Human selection (for later)
  selectedTheme: ThemeSchema.optional(),

  // Simple workflow control
  currentStep: z.string().default("brief_creation"),
  isComplete: z.boolean().default(false),
  needsHumanInput: z.boolean().default(false),
});

export type BasicWorkflowState = z.infer<typeof BasicWorkflowState>;

// Updated LangGraph annotation
export const BasicStateAnnotation = Annotation.Root({
  businessContext: Annotation<string>,
  targetAudience: Annotation<string>,
  marketingGoals: Annotation<string>,
  articlesCount: Annotation<number>,
  linkedinPostsCount: Annotation<number>,
  socialPostsCount: Annotation<number>,
  ctaType: Annotation<"download_whitepaper" | "contact_us">,
  ctaUrl: Annotation<string>,
  selectedWhitepaperId: Annotation<string>,
  marketingBrief: Annotation<string>,
  generatedThemes: Annotation<Theme[]>,
  previousThemes: Annotation<Theme[]>({
    reducer: (existing: Theme[], update: Theme[]) => [...existing, ...update],
    default: () => [],
  }),
  searchHistory: Annotation<string[]>({
    reducer: (existing: string[], update: string[]) => [...existing, ...update],
    default: () => [],
  }),
  regenerationCount: Annotation<number>,
  selectedTheme: Annotation<Theme>,
  currentStep: Annotation<string>,
  isComplete: Annotation<boolean>,
  needsHumanInput: Annotation<boolean>,
});

// Agent output schemas for structured parsing
export const MarketingBriefSchema = z.object({
  business_overview: z.string(),
  target_audience_analysis: z.string(),
  marketing_objectives: z.string(),
  key_messages: z.array(z.string()),
  tone_and_voice: z.string(),
  competitive_positioning: z.string(),
  success_metrics: z.array(z.string()),
});

export const ThemesOutputSchema = z.object({
  themes: z.array(ThemeSchema).length(3),
  recommendation: z.string(),
});

export const ResearchOutputSchema = z.object({
  key_insights: z.array(z.string()),
  supporting_data: z.array(
    z.object({
      fact: z.string(),
      source_context: z.string(),
    })
  ),
  industry_trends: z.array(z.string()),
  competitive_advantages: z.array(z.string()),
  use_cases: z.array(z.string()),
  technical_details: z.array(z.string()),
});

export const ArticleOutputSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  body: z.string(),
  word_count: z.number(),
  key_takeaways: z.array(z.string()),
  seo_keywords: z.array(z.string()),
  call_to_action: z.string(),
});

export const LinkedInPostSchema = z.object({
  hook: z.string(),
  body: z.string(),
  call_to_action: z.string(),
  hashtags: z.array(z.string()),
  character_count: z.number(),
});

export const LinkedInOutputSchema = z.object({
  posts: z.array(LinkedInPostSchema),
  campaign_narrative: z.string(),
});

export const SocialPostSchema = z.object({
  platform: z.enum(["twitter", "facebook", "instagram"]),
  content: z.string(),
  hashtags: z.array(z.string()),
  character_count: z.number(),
  visual_suggestion: z.string(),
});

export const SocialOutputSchema = z.object({
  posts: z.array(SocialPostSchema),
  posting_strategy: z.string(),
});

// Final output schema
export const FinalContentOutputSchema = z.object({
  marketing_brief: MarketingBriefSchema,
  selected_theme: ThemeSchema.optional(),
  generated_themes: z.array(ThemeSchema).optional(),
  workflow_state: z
    .object({
      currentStep: z.string(),
      needsHumanInput: z.boolean(),
      isComplete: z.boolean(),
    })
    .optional(),
  research: ResearchOutputSchema.optional(),
  article: ArticleOutputSchema.optional(),
  linkedin_posts: LinkedInOutputSchema.optional(),
  social_posts: SocialOutputSchema.optional(),
  generation_metadata: z.object({
    created_at: z.string(),
    processing_time_ms: z.number(),
    agents_used: z.array(z.string()),
    whitepaper_chunks_analyzed: z.number(),
  }),
});

// Type exports for the new system
export type MarketingBrief = z.infer<typeof MarketingBriefSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type ThemesOutput = z.infer<typeof ThemesOutputSchema>;
export type ResearchOutput = z.infer<typeof ResearchOutputSchema>;
export type ArticleOutput = z.infer<typeof ArticleOutputSchema>;
export type LinkedInOutput = z.infer<typeof LinkedInOutputSchema>;
export type SocialOutput = z.infer<typeof SocialOutputSchema>;
export type FinalContentOutput = z.infer<typeof FinalContentOutputSchema>;

// Legacy exports for backward compatibility (can be removed later)
export const UserInputSchema = BasicWorkflowState;
export type UserInput = BasicWorkflowState;
