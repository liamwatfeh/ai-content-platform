// API Route for Content Generation
import { NextRequest, NextResponse } from "next/server";
import { executeContentGeneration } from "@/lib/workflow";
import { BasicWorkflowState } from "@/lib/schemas/types";
import { z } from "zod";

// POST endpoint for content generation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input using Zod schema
    const validatedInput = BasicWorkflowState.parse(body);

    // Execute the LangGraph workflow
    const result = await executeContentGeneration(validatedInput);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Content generation error:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint for checking service status
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Content generation service is running",
    version: "1.0.0",
    agents: [
      "brief-creator",
      "theme-generator",
      "researcher",
      "article-writer",
      "linkedin-writer",
      "social-writer",
      "article-editor",
      "linkedin-editor",
      "social-editor",
    ],
  });
}
 