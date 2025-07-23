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

// Simplified Research Dossier Schema for Agent 3 output
export const ResearchDossierSchema = z.object({
  selectedTheme: ThemeSchema,

  // Core whitepaper evidence - streamlined
  whitepaperEvidence: z.object({
    keyFindings: z
      .array(
        z.object({
          claim: z.string().describe("The key claim or finding"),
          evidence: z.string().describe("Supporting evidence from whitepaper"),
          confidence: z
            .enum(["high", "medium", "low"])
            .describe("Confidence in the evidence"),
        })
      )
      .min(6)
      .max(8)
      .describe("Key evidence-backed findings from the whitepaper"),
  }),

  // 3 suggested content concepts for drafting agents to evaluate
  suggestedConcepts: z
    .array(
      z.object({
        title: z.string(),
        angle: z.string().describe("The unique perspective or angle"),
        whyItWorks: z
          .string()
          .describe("Why this concept will resonate with the audience"),
        keyEvidence: z
          .array(z.string())
          .length(3)
          .describe(
            "Top 3 pieces of whitepaper evidence supporting this concept"
          ),
        contentDirection: z
          .string()
          .describe(
            "Brief guidance for how drafting agents should approach this concept"
          ),
      })
    )
    .length(3)
    .describe(
      "3 content concepts for drafting agents to evaluate and choose from"
    ),

  // Simple research summary
  researchSummary: z
    .string()
    .describe("Summary of research findings and how they support the concepts"),
});

// Single article schema
const ArticleSchema = z.object({
  headline: z.string().describe("Compelling headline for the article"),
  subheadline: z
    .string()
    .describe("Supporting subheadline that elaborates on the main headline"),
  body: z
    .string()
    .describe("Main article content (~1000 words, Economist style)"),
  word_count: z.number().describe("Actual word count of the article body"),
  key_takeaways: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe("Key insights readers should remember"),
  seo_keywords: z
    .array(z.string())
    .min(3)
    .max(8)
    .describe("Relevant keywords for SEO optimization"),
  call_to_action: z
    .string()
    .describe("Clear call-to-action aligned with marketing goals"),
  concept_used: z
    .string()
    .describe("Which suggested concept from research dossier was used"),
});

// Multiple articles output schema for Agent 4a
export const ArticleOutputSchema = z.object({
  articles: z
    .array(ArticleSchema)
    .min(1)
    .max(3)
    .describe("Generated articles based on user's requested count"),
  generation_strategy: z
    .string()
    .describe("How the articles were differentiated and structured"),
  whitepaper_utilization: z
    .string()
    .describe("How whitepaper evidence was integrated across articles"),
});

// LinkedIn Post Schema for Agent 4b
export const LinkedInPostSchema = z.object({
  hook: z.string().describe("Attention-grabbing opening line"),
  body: z.string().describe("Main content of the LinkedIn post"),
  call_to_action: z.string().describe("Clear call-to-action for engagement"),
  character_count: z.number().describe("Total character count of the post"),
  concept_used: z
    .string()
    .describe("Which suggested concept from research dossier was used"),
});

export const LinkedInOutputSchema = z.object({
  posts: z
    .array(LinkedInPostSchema)
    .min(1)
    .max(10)
    .describe("Generated LinkedIn posts based on user's requested count"),
  generation_strategy: z
    .string()
    .describe("How the LinkedIn posts were differentiated and structured"),
  whitepaper_utilization: z
    .string()
    .describe("How whitepaper evidence was integrated across LinkedIn posts"),
});

// Social Post Schema for Agent 4c
export const SocialPostSchema = z.object({
  platform: z
    .enum(["twitter", "facebook", "instagram"])
    .describe("Target social media platform"),
  content: z
    .string()
    .describe("Short, punchy social media content optimized for the platform"),
  character_count: z.number().describe("Total character count of the post"),
  visual_suggestion: z
    .string()
    .describe("Suggestion for visual content to accompany the post"),
  concept_used: z
    .string()
    .describe("Which suggested concept from research dossier was used"),
});

export const SocialOutputSchema = z.object({
  posts: z
    .array(SocialPostSchema)
    .min(1)
    .max(15)
    .describe("Generated social media posts based on user's requested count"),
  generation_strategy: z
    .string()
    .describe(
      "How the social posts were differentiated and structured across platforms"
    ),
  whitepaper_utilization: z
    .string()
    .describe("How whitepaper evidence was integrated across social posts"),
});

// Editor Output Schemas for Agents 5a, 5b, 5c

// Article Editor Output Schema for Agent 5a
export const EditedArticleOutputSchema = z.object({
  articles: z
    .array(ArticleSchema)
    .min(1)
    .max(3)
    .describe("Edited and refined articles"),
  editing_notes: z
    .string()
    .describe("Summary of changes made during editing process"),
  quality_score: z
    .number()
    .min(1)
    .max(10)
    .describe("Overall quality score after editing"),
});

// LinkedIn Editor Output Schema for Agent 5b
export const EditedLinkedInOutputSchema = z.object({
  posts: z
    .array(LinkedInPostSchema)
    .min(1)
    .max(10)
    .describe("Edited and refined LinkedIn posts"),
  editing_notes: z
    .string()
    .describe("Summary of changes made during editing process"),
  quality_score: z
    .number()
    .min(1)
    .max(10)
    .describe("Overall quality score after editing"),
});

// Social Media Editor Output Schema for Agent 5c
export const EditedSocialOutputSchema = z.object({
  posts: z
    .array(SocialPostSchema)
    .min(1)
    .max(15)
    .describe("Edited and refined social media posts"),
  editing_notes: z
    .string()
    .describe("Summary of changes made during editing process"),
  quality_score: z
    .number()
    .min(1)
    .max(10)
    .describe("Overall quality score after editing"),
});

// Updated workflow state with Agent 3 fields
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

  // Human selection
  selectedTheme: ThemeSchema.optional(),

  // Agent 3 output
  researchDossier: ResearchDossierSchema.optional(),

  // Agent 4a output
  articleOutput: ArticleOutputSchema.optional(),

  // Agent 4b output
  linkedinOutput: LinkedInOutputSchema.optional(),

  // Agent 4c output
  socialOutput: SocialOutputSchema.optional(),

  // Agent 5a output (Article Editor)
  editedArticleOutput: EditedArticleOutputSchema.optional(),

  // Agent 5b output (LinkedIn Editor)
  editedLinkedInOutput: EditedLinkedInOutputSchema.optional(),

  // Agent 5c output (Social Editor)
  editedSocialOutput: EditedSocialOutputSchema.optional(),

  // Simple workflow control
  currentStep: z.string().default("brief_creation"),
  isComplete: z.boolean().default(false),
  needsHumanInput: z.boolean().default(false),
});

export type BasicWorkflowState = z.infer<typeof BasicWorkflowState>;

// Updated LangGraph annotation with Agent 3 fields
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
  researchDossier: Annotation<ResearchDossier>,
  articleOutput: Annotation<ArticleOutput>,
  linkedinOutput: Annotation<LinkedInOutput>,
  socialOutput: Annotation<SocialOutput>,
  editedArticleOutput: Annotation<EditedArticleOutput>,
  editedLinkedInOutput: Annotation<EditedLinkedInOutput>,
  editedSocialOutput: Annotation<EditedSocialOutput>,
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

// Final output schema - updated to handle both original and edited content
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
  research_dossier: ResearchDossierSchema.optional(),

  // Main content outputs - these will be the final versions (edited if available, otherwise original)
  article: z.union([ArticleOutputSchema, EditedArticleOutputSchema]).optional(),
  linkedin_posts: z
    .union([LinkedInOutputSchema, EditedLinkedInOutputSchema])
    .optional(),
  social_posts: z
    .union([SocialOutputSchema, EditedSocialOutputSchema])
    .optional(),

  // Optional: Include both original and edited content for comparison
  original_content: z
    .object({
      article: ArticleOutputSchema.optional(),
      linkedin_posts: LinkedInOutputSchema.optional(),
      social_posts: SocialOutputSchema.optional(),
    })
    .optional(),

  edited_content: z
    .object({
      article: EditedArticleOutputSchema.optional(),
      linkedin_posts: EditedLinkedInOutputSchema.optional(),
      social_posts: EditedSocialOutputSchema.optional(),
    })
    .optional(),

  generation_metadata: z.object({
    created_at: z.string(),
    processing_time_ms: z.number(),
    agents_used: z.array(z.string()),
    whitepaper_chunks_analyzed: z.number(),
    editing_completed: z.boolean().optional(),
    content_quality_scores: z
      .object({
        article: z.number().optional(),
        linkedin: z.number().optional(),
        social: z.number().optional(),
      })
      .optional(),
  }),
});

// Type exports for the new system
export type MarketingBrief = z.infer<typeof MarketingBriefSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type ThemesOutput = z.infer<typeof ThemesOutputSchema>;
export type ResearchDossier = z.infer<typeof ResearchDossierSchema>;
export type Article = z.infer<typeof ArticleSchema>;
export type ArticleOutput = z.infer<typeof ArticleOutputSchema>;
export type LinkedInOutput = z.infer<typeof LinkedInOutputSchema>;
export type SocialOutput = z.infer<typeof SocialOutputSchema>;
export type EditedArticleOutput = z.infer<typeof EditedArticleOutputSchema>;
export type EditedLinkedInOutput = z.infer<typeof EditedLinkedInOutputSchema>;
export type EditedSocialOutput = z.infer<typeof EditedSocialOutputSchema>;
export type FinalContentOutput = z.infer<typeof FinalContentOutputSchema>;

// Legacy exports for backward compatibility (can be removed later)
export const UserInputSchema = BasicWorkflowState;
export type UserInput = BasicWorkflowState;
