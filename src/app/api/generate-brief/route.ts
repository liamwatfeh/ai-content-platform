import { NextRequest, NextResponse } from "next/server";
import { contentWorkflow } from "../../../lib/workflow";
import { BasicWorkflowState } from "../../../lib/schemas/types";

export async function POST(req: NextRequest) {
  try {
    console.log("📥 Received request for brief generation");

    const body = await req.json();
    console.log("📄 Request body:", body);

    // Extract data from request body
    const {
      businessContext,
      targetAudience,
      marketingGoals,
      articlesCount = 1,
      linkedinPostsCount = 4,
      socialPostsCount = 8,
      ctaType,
      ctaUrl,
    } = body;

    // Validate required fields
    if (!businessContext || !targetAudience || !marketingGoals || !ctaType) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: businessContext, targetAudience, marketingGoals, ctaType",
        },
        { status: 400 }
      );
    }

    // Create initial state
    const initialState: BasicWorkflowState = {
      businessContext,
      targetAudience,
      marketingGoals,
      articlesCount,
      linkedinPostsCount,
      socialPostsCount,
      ctaType,
      ctaUrl,
      // Agent 2 memory fields
      previousThemes: [],
      searchHistory: [],
      regenerationCount: 0,
      // Workflow control
      currentStep: "brief_creation",
      isComplete: false,
      needsHumanInput: false,
    };

    console.log("🚀 Starting workflow with state:", initialState);

    // Run the workflow
    const result = await contentWorkflow.invoke(initialState);

    console.log("✅ Workflow completed:", result);

    // Return the result
    return NextResponse.json({
      success: true,
      data: {
        marketingBrief: result.marketingBrief,
        currentStep: result.currentStep,
        isComplete: result.isComplete,
      },
    });
  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint for checking service status
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Brief generation service is running",
    version: "1.0.0",
    agent: "brief-creator",
  });
}
 