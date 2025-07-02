import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET - List all whitepapers
export async function GET() {
  try {
    const { data: whitepapers, error } = await supabase
      .from("whitepapers")
      .select(
        `
        *,
        reference_buckets (
          id,
          name,
          pinecone_index_name
        )
      `
      )
      .order("upload_date", { ascending: false });

    if (error) {
      console.error("Failed to fetch whitepapers:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch whitepapers" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      whitepapers: whitepapers || [],
    });
  } catch (error) {
    console.error("Error fetching whitepapers:", error);

    // Ensure we always return JSON, never HTML
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch whitepapers";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
