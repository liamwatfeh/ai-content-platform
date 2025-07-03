// Simplified Workflow Orchestrator - Updated for Frontend with Agent 2
import { StateGraph, START, END } from "@langchain/langgraph";
import {
  BasicStateAnnotation,
  BasicWorkflowState,
  FinalContentOutput,
} from "./schemas/types";
import { briefCreatorAgent } from "./agents/agent1-brief-creator";
import { themeGeneratorAgent } from "./agents/agent2-theme-generator";

// Conditional function to determine next step after Agent 1
function shouldContinueAfterBrief(state: BasicWorkflowState): string {
  // If we have a marketing brief, move to theme generation
  if (state.marketingBrief && state.currentStep === "brief_complete") {
    return "generate_themes";
  }
  return END;
}

// Conditional function to determine next step after Agent 2
function shouldContinueAfterThemes(state: BasicWorkflowState): string {
  // After generating themes, we need human input to select one
  if (state.generatedThemes && state.generatedThemes.length === 3) {
    return "await_theme_selection";
  }
  return END;
}

// Placeholder node for human theme selection (will be handled by frontend)
async function awaitThemeSelection(
  state: BasicWorkflowState
): Promise<Partial<BasicWorkflowState>> {
  console.log("⏸️ Workflow paused - waiting for user to select theme");

    return {
    currentStep: "awaiting_theme_selection",
    needsHumanInput: true,
    isComplete: false,
  };
}

// Create the updated workflow graph
export function createContentWorkflow() {
  const workflow = new StateGraph(BasicStateAnnotation)
    // Add all nodes
    .addNode("brief_creator", briefCreatorAgent)
    .addNode("generate_themes", themeGeneratorAgent)
    .addNode("await_theme_selection", awaitThemeSelection)

    // Define the flow
    .addEdge(START, "brief_creator")
    .addConditionalEdges("brief_creator", shouldContinueAfterBrief)
    .addConditionalEdges("generate_themes", shouldContinueAfterThemes)
    .addEdge("await_theme_selection", END);

  return workflow.compile();
}

// Export the compiled workflow
export const contentWorkflow = createContentWorkflow();

// Helper function to handle theme selection and continue workflow
export async function continueWithSelectedTheme(
  currentState: BasicWorkflowState,
  selectedThemeId: string
): Promise<BasicWorkflowState> {
  console.log(`👤 User selected theme: ${selectedThemeId}`);

  // Find the selected theme
  const selectedTheme = currentState.generatedThemes?.find(
    (theme) => theme.id === selectedThemeId
  );

  if (!selectedTheme) {
    throw new Error(`Theme with ID ${selectedThemeId} not found`);
  }

  // Update state with selected theme
  const updatedState: BasicWorkflowState = {
    ...currentState,
    selectedTheme,
    // Move previous themes to memory to avoid repeating them
    previousThemes: [
      ...(currentState.previousThemes || []),
      ...(currentState.generatedThemes || []),
    ],
    currentStep: "theme_selected",
    needsHumanInput: false,
    isComplete: true, // For now, mark as complete after theme selection
  };

  console.log(`✅ Theme selected: "${selectedTheme.title}"`);
  return updatedState;
}

// Helper function to regenerate themes
export async function regenerateThemes(
  currentState: BasicWorkflowState
): Promise<BasicWorkflowState> {
  console.log("🔄 Regenerating themes...");

  // Move current themes to previous themes to avoid repeating
  const updatedState: BasicWorkflowState = {
    ...currentState,
    previousThemes: [
      ...(currentState.previousThemes || []),
      ...(currentState.generatedThemes || []),
    ],
    generatedThemes: undefined, // Clear current themes
    currentStep: "brief_complete", // Reset to run theme generation again
    needsHumanInput: false,
  };

  // Run theme generation again
  const result = await themeGeneratorAgent(updatedState);

  return {
    ...updatedState,
    ...result,
  };
}

// Legacy execution function for backward compatibility
export async function executeContentGeneration(
  input: BasicWorkflowState
): Promise<FinalContentOutput> {
  const startTime = Date.now();

  try {
    console.log("Starting content generation workflow...");

    // Run the LangGraph workflow
    const result = await contentWorkflow.invoke(input);

    console.log("LangGraph workflow completed, processing results...");

    // Parse the marketing brief if it's a string
    let marketingBrief;
    try {
      marketingBrief =
        typeof result.marketingBrief === "string"
          ? JSON.parse(result.marketingBrief)
          : result.marketingBrief;
    } catch (error) {
      console.error("Error parsing marketing brief:", error);
      // Fallback to a basic structure
      marketingBrief = {
        executiveSummary: "Generated marketing brief",
        targetPersona: {
          demographic: "Target demographic",
          psychographic: "Target psychographic",
          painPoints: ["Pain point 1"],
          motivations: ["Motivation 1"],
        },
        campaignObjectives: ["Objective 1"],
        keyMessages: ["Key message 1"],
        contentStrategy: {
          articles: input.articlesCount,
          linkedinPosts: input.linkedinPostsCount,
          socialPosts: input.socialPostsCount,
        },
        callToAction: {
          type: input.ctaType,
          message: "Contact us today",
          url: input.ctaUrl,
        },
      };
    }

    // Create placeholder content based on the brief
    const articleOutput =
      input.articlesCount > 0
        ? {
            headline: "AI-Driven Insights for Your Business",
            subheadline:
              "Discover how our solutions can transform your operations",
            body: "This article is generated based on the marketing brief and will be enhanced by future agents.",
            word_count: 500,
            key_takeaways: ["Key insight 1", "Key insight 2", "Key insight 3"],
            seo_keywords: ["AI", "business", "transformation"],
            call_to_action:
              input.ctaType === "download_whitepaper"
                ? "Download our whitepaper"
                : "Contact us today",
          }
        : undefined;

    const linkedInOutput =
      input.linkedinPostsCount > 0
        ? {
            posts: Array.from({ length: input.linkedinPostsCount }, (_, i) => ({
              hook: `🚀 Insight #${i + 1}: Transform your business with AI`,
              body: "Based on our marketing brief, we've identified key opportunities for your industry...",
              call_to_action: "What's your experience with AI in your field?",
              hashtags: ["#AI", "#business", "#innovation", "#growth"],
              character_count: 280,
            })),
            campaign_narrative:
              "Professional LinkedIn engagement strategy based on marketing brief",
          }
        : undefined;

    const socialOutput =
      input.socialPostsCount > 0
        ? {
            posts: Array.from({ length: input.socialPostsCount }, (_, i) => ({
              platform: (["twitter", "facebook", "instagram"] as const)[i % 3],
              content: `🔥 Game-changing insight #${i + 1}! Our latest brief reveals transformative opportunities...`,
              hashtags: ["#trending", "#business", "#AI"],
              character_count: 140,
              visual_suggestion:
                "Infographic based on marketing brief insights",
            })),
            posting_strategy:
              "Multi-platform approach aligned with marketing brief",
          }
        : undefined;

    // Return final structured output
  const finalOutput: FinalContentOutput = {
      marketing_brief: marketingBrief,
      selected_theme: result.selectedTheme,
      article: articleOutput,
      linkedin_posts: linkedInOutput,
      social_posts: socialOutput,
      generated_themes: result.generatedThemes,
      workflow_state: {
        currentStep: result.currentStep,
        needsHumanInput: result.needsHumanInput,
        isComplete: result.isComplete,
      },
    generation_metadata: {
      created_at: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
        agents_used: result.generatedThemes
          ? ["brief-creator", "theme-generator"]
          : ["brief-creator"],
        whitepaper_chunks_analyzed: result.searchHistory?.length || 0,
      },
    };

    console.log("Content generation completed successfully");
  return finalOutput;
  } catch (error) {
    console.error("Content generation error:", error);
    throw new Error(
      `Content generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
