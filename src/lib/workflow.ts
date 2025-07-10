// Simplified Workflow Orchestrator - Updated for Frontend with Agent 2 & 3
import { StateGraph, START, END } from "@langchain/langgraph";
import {
  BasicStateAnnotation,
  BasicWorkflowState,
  FinalContentOutput,
} from "./schemas/types";
import { briefCreatorAgent } from "./agents/agent1-brief-creator";
import { themeGeneratorAgent } from "./agents/agent2-theme-generator";
import { deepResearchAgent } from "./agents/agent3-researcher";
import { articleWriterAgent } from "./agents/agent4a-article-writer";
import { linkedinWriterAgent } from "./agents/agent4b-linkedin-writer";
import { socialWriterAgent } from "./agents/agent4c-social-writer";
import { articleEditorAgent } from "./agents/agent5a-article-editor";
import { linkedinEditorAgent } from "./agents/agent5b-linkedin-editor";
import { socialEditorAgent } from "./agents/agent5c-social-editor";

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

// Conditional function to determine next step after theme selection
function shouldContinueAfterThemeSelection(state: BasicWorkflowState): string {
  // If we have a selected theme, move to deep research
  if (state.selectedTheme && state.currentStep === "theme_selected") {
    return "deep_research";
  }
  return END;
}

// Conditional function to determine next step after Agent 3
function shouldContinueAfterResearch(state: BasicWorkflowState): string {
  // After deep research, continue to content generation if any content is requested
  if (
    state.researchDossier &&
    state.currentStep === "research_complete" &&
    (state.articlesCount > 0 ||
      state.linkedinPostsCount > 0 ||
      state.socialPostsCount > 0)
  ) {
    return "generate_content_parallel";
  }
  return END;
}

// Conditional function to determine next step after parallel content generation
function shouldContinueAfterContentGeneration(
  state: BasicWorkflowState
): string {
  // After generating content, continue to editing if any content was generated
  if (
    state.currentStep === "content_generated" &&
    (state.articleOutput || state.linkedinOutput || state.socialOutput)
  ) {
    return "edit_content_parallel";
  }
  return END;
}

// Conditional function to determine next step after parallel editing
function shouldContinueAfterEditing(state: BasicWorkflowState): string {
  // After editing all content, we're complete
  if (state.currentStep === "content_edited") {
    return END;
  }
  return END;
}

// Placeholder node for human theme selection (will be handled by frontend)
async function awaitThemeSelection(
  state: BasicWorkflowState
): Promise<Partial<BasicWorkflowState>> {
  console.log("⏸️ Workflow paused - waiting for user to select theme");
  console.log(`Current state: ${state.currentStep}`);

  return {
    currentStep: "awaiting_theme_selection",
    needsHumanInput: true,
    isComplete: false,
  };
}

// Parallel content generation node that runs agents 4a, 4b, 4c in parallel
async function generateContentParallel(
  state: BasicWorkflowState
): Promise<Partial<BasicWorkflowState>> {
  console.log("🚀 Starting parallel content generation (Agents 4a, 4b, 4c)...");

  const promises: Promise<Partial<BasicWorkflowState>>[] = [];

  // Run Agent 4a (Articles) if articles are requested
  if (state.articlesCount > 0) {
    console.log("📝 Starting Agent 4a (Articles) in parallel...");
    promises.push(articleWriterAgent(state));
  }

  // Run Agent 4b (LinkedIn) if LinkedIn posts are requested
  if (state.linkedinPostsCount > 0) {
    console.log("💼 Starting Agent 4b (LinkedIn) in parallel...");
    promises.push(linkedinWriterAgent(state));
  }

  // Run Agent 4c (Social) if social posts are requested
  if (state.socialPostsCount > 0) {
    console.log("📱 Starting Agent 4c (Social) in parallel...");
    promises.push(socialWriterAgent(state));
  }

  if (promises.length === 0) {
    console.log("⚠️ No content requested, skipping content generation");
    return {
      currentStep: "content_generated",
      isComplete: true,
    };
  }

  try {
    // Wait for all agents to complete in parallel
    const results = await Promise.all(promises);

    // Merge all results into final state
    const mergedResults = results.reduce(
      (acc, result) => ({
        ...acc,
        ...result,
      }),
      {}
    );

    console.log("✅ All parallel content generation completed successfully");

    return {
      ...mergedResults,
      currentStep: "content_generated",
      isComplete: true,
    };
  } catch (error) {
    console.error("❌ Parallel content generation failed:", error);
    throw error;
  }
}

// Parallel content editing node that runs agents 5a, 5b, 5c in parallel
async function editContentParallel(
  state: BasicWorkflowState
): Promise<Partial<BasicWorkflowState>> {
  console.log("✏️ Starting parallel content editing (Agents 5a, 5b, 5c)...");

  const promises: Promise<Partial<BasicWorkflowState>>[] = [];

  // Run Agent 5a (Article Editor) if articles were generated
  if (state.articleOutput) {
    console.log("📝 Starting Agent 5a (Article Editor) in parallel...");
    promises.push(articleEditorAgent(state));
  }

  // Run Agent 5b (LinkedIn Editor) if LinkedIn posts were generated
  if (state.linkedinOutput) {
    console.log("💼 Starting Agent 5b (LinkedIn Editor) in parallel...");
    promises.push(linkedinEditorAgent(state));
  }

  // Run Agent 5c (Social Editor) if social posts were generated
  if (state.socialOutput) {
    console.log("📱 Starting Agent 5c (Social Editor) in parallel...");
    promises.push(socialEditorAgent(state));
  }

  if (promises.length === 0) {
    console.log("⚠️ No content to edit, skipping editing phase");
    return {
      currentStep: "content_edited",
      isComplete: true,
    };
  }

  try {
    // Wait for all editor agents to complete in parallel
    const results = await Promise.all(promises);

    // Merge all results into final state
    const mergedResults = results.reduce(
      (acc, result) => ({
        ...acc,
        ...result,
      }),
      {}
    );

    console.log("✅ All parallel content editing completed successfully");

    return {
      ...mergedResults,
      currentStep: "content_edited",
      isComplete: true,
    };
  } catch (error) {
    console.error("❌ Parallel content editing failed:", error);
    throw error;
  }
}

// Create the updated workflow graph with parallel content generation
export function createContentWorkflow() {
  const workflow = new StateGraph(BasicStateAnnotation)
    // Add all nodes
    .addNode("brief_creator", briefCreatorAgent)
    .addNode("generate_themes", themeGeneratorAgent)
    .addNode("await_theme_selection", awaitThemeSelection)
    .addNode("deep_research", deepResearchAgent)
    .addNode("generate_content_parallel", generateContentParallel)
    .addNode("edit_content_parallel", editContentParallel)

    // Define the flow
    .addEdge(START, "brief_creator")
    .addConditionalEdges("brief_creator", shouldContinueAfterBrief)
    .addConditionalEdges("generate_themes", shouldContinueAfterThemes)
    .addConditionalEdges(
      "await_theme_selection",
      shouldContinueAfterThemeSelection
    )
    .addConditionalEdges("deep_research", shouldContinueAfterResearch)
    .addConditionalEdges(
      "generate_content_parallel",
      shouldContinueAfterContentGeneration
    )
    .addConditionalEdges("edit_content_parallel", shouldContinueAfterEditing);

  return workflow.compile();
}

// Export the compiled workflow
export const contentWorkflow = createContentWorkflow();

// Helper function to handle theme selection and continue workflow with Agent 3 & 4a
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
  let currentWorkflowState: BasicWorkflowState = {
    ...currentState,
    selectedTheme,
    // Move previous themes to memory to avoid repeating them
    previousThemes: [
      ...(currentState.previousThemes || []),
      ...(currentState.generatedThemes || []),
    ],
    currentStep: "theme_selected",
    needsHumanInput: false,
    isComplete: false, // Not complete yet - need to run Agent 3 & 4a+
  };

  console.log(
    `✅ Theme selected: "${selectedTheme.title}", running deep research...`
  );

  // Run Agent 3 (Deep Research) directly
  const agent3Result = await deepResearchAgent(currentWorkflowState);

  // Update state with Agent 3 results
  currentWorkflowState = {
    ...currentWorkflowState,
    ...agent3Result,
  };

  // Check if we should continue to content generation
  if (
    currentWorkflowState.researchDossier &&
    (currentWorkflowState.articlesCount > 0 ||
      currentWorkflowState.linkedinPostsCount > 0 ||
      currentWorkflowState.socialPostsCount > 0)
  ) {
    console.log(
      "🚀 Running parallel content generation (Agents 4a, 4b, 4c)..."
    );

    // Run parallel content generation
    const contentResult = await generateContentParallel(currentWorkflowState);

    // Update state with content generation results
    currentWorkflowState = {
      ...currentWorkflowState,
      ...contentResult,
    };

    // Check if we should continue to editing
    if (
      currentWorkflowState.currentStep === "content_generated" &&
      (currentWorkflowState.articleOutput ||
        currentWorkflowState.linkedinOutput ||
        currentWorkflowState.socialOutput)
    ) {
      console.log("✏️ Running parallel content editing (Agents 5a, 5b, 5c)...");

      // Run parallel content editing
      const editingResult = await editContentParallel(currentWorkflowState);

      // Update state with editing results
      currentWorkflowState = {
        ...currentWorkflowState,
        ...editingResult,
      };
    }
  }

  return currentWorkflowState;
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

// Main execution function that returns complete workflow results including edited content
export async function executeContentGeneration(
  input: BasicWorkflowState
): Promise<FinalContentOutput> {
  const startTime = Date.now();

  try {
    console.log("Starting complete content generation workflow...");
    console.log(`🔍 Current step: ${input.currentStep}`);

    let result: BasicWorkflowState;

    // If we have a selected theme and are at theme_selected step, continue from Agent 3
    if (input.selectedTheme && input.currentStep === "theme_selected") {
      console.log("📍 Resuming workflow from Agent 3 (Deep Research)...");

      // Use the continueWithSelectedTheme helper function
      result = await continueWithSelectedTheme(input, input.selectedTheme.id);
    } else {
      console.log("🚀 Starting workflow from the beginning...");

      // Run the LangGraph workflow from the start
      result = await contentWorkflow.invoke(input, {
        recursionLimit: 15, // Allow for full pipeline execution
      });
    }

    console.log("LangGraph workflow completed, processing final results...");

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
        business_overview: "Generated marketing brief",
        target_audience_analysis: "Target audience analysis",
        marketing_objectives: "Marketing objectives",
        key_messages: ["Key message 1"],
        tone_and_voice: "Professional and engaging",
        competitive_positioning: "Market positioning",
        success_metrics: ["Metric 1"],
      };
    }

    // Determine which agents ran based on available outputs
    const agentsUsed = [
      "brief-creator",
      ...(result.generatedThemes ? ["theme-generator"] : []),
      ...(result.researchDossier ? ["deep-researcher"] : []),
      ...(result.articleOutput ? ["article-writer"] : []),
      ...(result.linkedinOutput ? ["linkedin-writer"] : []),
      ...(result.socialOutput ? ["social-writer"] : []),
      ...(result.editedArticleOutput ? ["article-editor"] : []),
      ...(result.editedLinkedInOutput ? ["linkedin-editor"] : []),
      ...(result.editedSocialOutput ? ["social-editor"] : []),
    ];

    // Determine final content outputs - prefer edited content if available
    const finalArticleOutput =
      result.editedArticleOutput || result.articleOutput;
    const finalLinkedInOutput =
      result.editedLinkedInOutput || result.linkedinOutput;
    const finalSocialOutput = result.editedSocialOutput || result.socialOutput;

    // Return final structured output with ALL results including edited content
    const finalOutput: FinalContentOutput = {
      marketing_brief: marketingBrief,
      selected_theme: result.selectedTheme,
      generated_themes: result.generatedThemes,
      research_dossier: result.researchDossier,

      // Use edited content if available, otherwise fall back to original
      article: finalArticleOutput,
      linkedin_posts: finalLinkedInOutput,
      social_posts: finalSocialOutput,

      // Include both original and edited outputs for comparison (optional)
      original_content: {
        article: result.articleOutput,
        linkedin_posts: result.linkedinOutput,
        social_posts: result.socialOutput,
      },

      edited_content: {
        article: result.editedArticleOutput,
        linkedin_posts: result.editedLinkedInOutput,
        social_posts: result.editedSocialOutput,
      },

      workflow_state: {
        currentStep: result.currentStep,
        needsHumanInput: result.needsHumanInput,
        isComplete: result.isComplete,
      },

      generation_metadata: {
        created_at: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
        agents_used: agentsUsed,
        whitepaper_chunks_analyzed: result.searchHistory?.length || 0,
        editing_completed: !!(
          result.editedArticleOutput ||
          result.editedLinkedInOutput ||
          result.editedSocialOutput
        ),
        content_quality_scores: {
          article: result.editedArticleOutput?.quality_score,
          linkedin: result.editedLinkedInOutput?.quality_score,
          social: result.editedSocialOutput?.quality_score,
        },
      },
    };

    console.log(
      "✅ Complete content generation workflow finished successfully"
    );
    console.log(
      `📊 Total agents used: ${agentsUsed.length} - ${agentsUsed.join(", ")}`
    );
    console.log(
      `⏱️ Total processing time: ${(Date.now() - startTime) / 1000}s`
    );

    if (finalOutput.generation_metadata.editing_completed) {
      console.log(
        "✏️ Edited content available - returning final polished versions"
      );
    }

    return finalOutput;
  } catch (error) {
    console.error("Content generation error:", error);
    throw new Error(
      `Content generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
