// Agent 5a: Article Editor
// Model: Claude Sonnet 4 (with thinking enabled)
// Purpose: Proofread and edit article drafts using Economist style guide

import { ChatAnthropic } from "@langchain/anthropic";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import type {
  BasicWorkflowState,
  ArticleOutput,
  MarketingBrief,
} from "../schemas/types";
import { EditedArticleOutputSchema } from "../schemas/types";

// Initialize Claude Sonnet 4 with thinking enabled
const llm = new ChatAnthropic({
  modelName: "claude-sonnet-4-20250514",
  temperature: 0.3,
  maxTokens: 4000,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

// Create output parser for edited articles
const editedArticleOutputParser = StructuredOutputParser.fromZodSchema(
  EditedArticleOutputSchema
);

export async function articleEditorAgent(
  state: BasicWorkflowState
): Promise<Partial<BasicWorkflowState>> {
  console.log("✏️ Agent 5a: Starting article editing...");

  try {
    // Validate inputs
    if (!state.marketingBrief) {
      throw new Error("Marketing brief is required for article editing");
    }

    if (!state.articleOutput) {
      throw new Error("Article output is required for editing");
    }

    const marketingBrief = JSON.parse(state.marketingBrief) as MarketingBrief;
    const articleOutput = state.articleOutput as ArticleOutput;

    console.log(`✏️ Editing ${articleOutput.articles.length} article(s)...`);

    // Create the article editing prompt
    const editingPrompt = `MARKETING BRIEF:
Business: ${marketingBrief.business_overview}
Audience: ${marketingBrief.target_audience_analysis}
Objectives: ${marketingBrief.marketing_objectives}
Key Messages: ${marketingBrief.key_messages.join(" | ")}
Tone: ${marketingBrief.tone_and_voice}

ARTICLES TO EDIT:
${articleOutput.articles
  .map(
    (article, i) => `
ARTICLE ${i + 1}:
Headline: ${article.headline}
Subheadline: ${article.subheadline}
Word Count: ${article.word_count}
Body: ${article.body}
Key Takeaways: ${Array.isArray(article.key_takeaways) ? article.key_takeaways.join(" | ") : "Not specified"}
Call to Action: ${article.call_to_action}
`
  )
  .join("\n")}

${editedArticleOutputParser.getFormatInstructions()}`;

    console.log("🎯 Editing articles with Claude Sonnet 4...");

    // Generate edited articles using Claude
    const systemPrompt = `You are a professional editor specializing in The Economist style guide. Review and edit article drafts to improve them while maintaining their core message and structure.

EDITING FOCUS:
- Grammar and spelling accuracy
- Clarity and readability improvements
- Logical flow and structure optimization
- Fact-checking consistency with the marketing brief
- Tone and voice alignment with brand requirements
- Compelling headlines and subheadings
- Strong opening and closing sections
- Call-to-action effectiveness
- Word count optimization (~1000 words per article)

EDITING PRINCIPLES:
- Maintain the original intent and key messages
- Enhance clarity without losing sophistication
- Ensure consistency across all articles
- Improve engagement and readability
- Strengthen evidence integration
- Polish professional language

Provide edited articles with clear improvements while preserving the strategic content direction.`;

    const editorResponse = await llm.invoke([
      {
        role: "system",
        content: systemPrompt,
      },
      { role: "user", content: editingPrompt },
    ]);

    console.log("📝 Article editing completed, parsing output...");

    // Parse the edited article output
    const editedArticleOutput = await editedArticleOutputParser.parse(
      editorResponse.content as string
    );

    console.log(
      `✅ Agent 5a: Edited ${editedArticleOutput.articles.length} article(s) successfully`
    );
    console.log(`📊 Quality Score: ${editedArticleOutput.quality_score}/10`);
    console.log(`📝 Editing Notes: ${editedArticleOutput.editing_notes}`);

    return {
      editedArticleOutput,
      currentStep: "articles_edited",
      needsHumanInput: false,
    };
  } catch (error) {
    console.error("❌ Agent 5a Error:", error);
    throw new Error(
      `Article editing failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Legacy export for backward compatibility (keeping the old pattern)
export const ArticleEditorAgent = {
  name: "article-editor",
  model: "claude-sonnet-4-20250514",
  systemPrompt: `You are a professional editor specializing in The Economist style guide. Review and edit article drafts to improve them.

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

  userPromptTemplate: `Marketing brief: {marketing_brief}
Article draft: {article_draft}`,

  tools: ["output-parser"],
};

export type ArticleEditorAgentType = typeof ArticleEditorAgent;
