// API endpoint for Agent 4a - Article Generation
import { NextRequest, NextResponse } from "next/server";
import { articleWriterAgent } from "@/lib/agents/agent4a-article-writer";
import type { BasicWorkflowState } from "@/lib/schemas/types";

export async function POST(request: NextRequest) {
  try {
    console.log("📝 Article generation API called");

    const body = await request.json();
    const { currentState }: { currentState: BasicWorkflowState } = body;

    // Validate required inputs
    if (!currentState.marketingBrief) {
      return NextResponse.json(
        { error: "Marketing brief is required" },
        { status: 400 }
      );
    }

    if (!currentState.researchDossier) {
      return NextResponse.json(
        { error: "Research dossier is required" },
        { status: 400 }
      );
    }

    if (!currentState.selectedTheme) {
      return NextResponse.json(
        { error: "Selected theme is required" },
        { status: 400 }
      );
    }

    console.log(
      `🎯 Generating ${currentState.articlesCount || 1} article(s)...`
    );

    // Run Agent 4a
    const result = await articleWriterAgent(currentState);

    console.log("✅ Articles generated successfully");

    // Return the updated state
    return NextResponse.json({
      success: true,
      currentState: {
        ...currentState,
        ...result,
      },
    });
  } catch (error) {
    console.error("❌ Article generation error:", error);
    return NextResponse.json(
      {
        error: "Article generation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
