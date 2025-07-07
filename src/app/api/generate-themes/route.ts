import { NextRequest, NextResponse } from "next/server";
import { BasicWorkflowState } from "@/lib/schemas/types";
import {
  contentWorkflow,
  continueWithSelectedTheme,
  regenerateThemes,
} from "@/lib/workflow";

// POST: Run the complete Agent 1 + Agent 2 workflow
export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Starting theme generation workflow...");

    const body = await request.json();
    console.log("📋 Received input:", body);

    // Validate input
    const input: BasicWorkflowState = {
      businessContext: body.businessContext,
      targetAudience: body.targetAudience,
      marketingGoals: body.marketingGoals,
      articlesCount: body.articlesCount || 1,
      linkedinPostsCount: body.linkedinPostsCount || 4,
      socialPostsCount: body.socialPostsCount || 8,
      ctaType: body.ctaType || "contact_us",
      ctaUrl: body.ctaUrl,
      selectedWhitepaperId: body.selectedWhitepaperId,
      currentStep: "brief_creation",
      isComplete: false,
      needsHumanInput: false,
      previousThemes: [],
      searchHistory: [],
      regenerationCount: 0,
    };

    // Run the workflow (Agent 1 → Agent 2 → await selection)
    const result = await contentWorkflow.invoke(input);

    console.log("✅ Workflow completed, result:", {
      currentStep: result.currentStep,
      needsHumanInput: result.needsHumanInput,
      themesGenerated: result.generatedThemes?.length || 0,
    });

    // Parse marketing brief if it's a string
    let marketingBrief;
    try {
      marketingBrief =
        typeof result.marketingBrief === "string"
          ? JSON.parse(result.marketingBrief)
          : result.marketingBrief;
    } catch (error) {
      console.error("Error parsing marketing brief:", error);
      throw new Error("Failed to parse marketing brief");
    }

    return NextResponse.json({
      success: true,
      marketing_brief: marketingBrief,
      generated_themes: result.generatedThemes,
      workflow_state: {
        currentStep: result.currentStep,
        needsHumanInput: result.needsHumanInput,
        isComplete: result.isComplete,
      },
      generation_metadata: {
        created_at: new Date().toISOString(),
        agents_used: ["brief-creator", "theme-generator"],
        searches_performed: result.searchHistory?.length || 0,
        regeneration_count: result.regenerationCount || 0,
      },
    });
  } catch (error) {
    console.error("❌ Theme generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT: Handle theme selection or regeneration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, currentState, selectedThemeId } = body;

    if (action === "select_theme") {
      if (!selectedThemeId) {
        return NextResponse.json(
          { success: false, error: "selectedThemeId is required" },
          { status: 400 }
        );
      }

      console.log(`👤 Processing theme selection: ${selectedThemeId}`);
      const updatedState = await continueWithSelectedTheme(
        currentState,
        selectedThemeId
      );

      return NextResponse.json({
        success: true,
        message: `Theme "${updatedState.selectedTheme?.title}" selected successfully`,
        workflow_state: {
          currentStep: updatedState.currentStep,
          needsHumanInput: updatedState.needsHumanInput,
          isComplete: updatedState.isComplete,
        },
        selected_theme: updatedState.selectedTheme,
      });
    } else if (action === "regenerate_themes") {
      console.log("🔄 Processing theme regeneration...");
      const updatedState = await regenerateThemes(currentState);

      return NextResponse.json({
        success: true,
        message: "New themes generated successfully",
        generated_themes: updatedState.generatedThemes,
        workflow_state: {
          currentStep: updatedState.currentStep,
          needsHumanInput: updatedState.needsHumanInput,
          isComplete: updatedState.isComplete,
        },
        generation_metadata: {
          regeneration_count: (currentState.regenerationCount || 0) + 1,
          searches_performed: updatedState.searchHistory?.length || 0,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Use 'select_theme' or 'regenerate_themes'",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("❌ Theme action error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET: Service status
export async function GET() {
  return NextResponse.json({
    service: "Theme Generation API",
    status: "active",
    endpoints: {
      POST: "Run complete workflow (Agent 1 + Agent 2)",
      PUT: "Handle theme selection or regeneration",
    },
    updated: new Date().toISOString(),
  });
}
