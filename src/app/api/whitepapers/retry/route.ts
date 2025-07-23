import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("🔁 [RETRY] Retry processing API called");

  try {
    const { whitepaperIds } = await request.json();

    if (
      !whitepaperIds ||
      !Array.isArray(whitepaperIds) ||
      whitepaperIds.length === 0
    ) {
      return NextResponse.json(
        { error: "Whitepaper IDs are required" },
        { status: 400 }
      );
    }

    console.log(
      `🔄 [RETRY] Retrying processing for ${whitepaperIds.length} whitepapers:`,
      whitepaperIds
    );

    // Initialize Supabase client
    const { supabase } = await import("@/lib/supabase");

    // Get the failed whitepapers
    const { data: whitepapers, error: fetchError } = await supabase
      .from("whitepapers")
      .select("*")
      .in("id", whitepaperIds)
      .eq("processing_status", "failed");

    if (fetchError) {
      console.error("❌ [RETRY] Failed to fetch whitepapers:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch whitepapers" },
        { status: 500 }
      );
    }

    if (!whitepapers || whitepapers.length === 0) {
      return NextResponse.json(
        { error: "No failed whitepapers found with the provided IDs" },
        { status: 404 }
      );
    }

    console.log(
      `✅ [RETRY] Found ${whitepapers.length} failed whitepapers to retry`
    );

    // Reset status to processing
    const { error: updateError } = await supabase
      .from("whitepapers")
      .update({
        processing_status: "processing",
        updated_at: new Date().toISOString(),
      })
      .in("id", whitepaperIds);

    if (updateError) {
      console.error(
        "❌ [RETRY] Failed to update whitepaper status:",
        updateError
      );
      return NextResponse.json(
        { error: "Failed to update whitepaper status" },
        { status: 500 }
      );
    }

    console.log("✅ [RETRY] Updated whitepaper status to processing");

    // Process each whitepaper in the background
    const processingPromises = whitepapers.map(async (whitepaper) => {
      try {
        console.log(
          `🔄 [RETRY] Starting retry processing for whitepaper: ${whitepaper.id}`
        );

        // Download the file from storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from("whitepapers")
          .download(whitepaper.file_url);

        if (downloadError) {
          console.error(
            `❌ [RETRY] Failed to download file for ${whitepaper.id}:`,
            downloadError
          );
          await supabase
            .from("whitepapers")
            .update({ processing_status: "failed" })
            .eq("id", whitepaper.id);
          return;
        }

        // Convert blob to buffer
        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(
          `📥 [RETRY] Downloaded file for ${whitepaper.id}, size: ${buffer.length} bytes`
        );

        // Import and call the background processing function
        const { processWhitepaperBackground } = await import(
          "@/lib/whitepaper-processor"
        );

        console.log(
          `🚀 [RETRY] Starting background processing for ${whitepaper.id}`
        );
        await processWhitepaperBackground(whitepaper.id, buffer);

        console.log(
          `✅ [RETRY] Successfully completed retry processing for ${whitepaper.id}`
        );
      } catch (error) {
        console.error(
          `❌ [RETRY] Error processing whitepaper ${whitepaper.id}:`,
          error
        );

        // Update status to failed
        await supabase
          .from("whitepapers")
          .update({ processing_status: "failed" })
          .eq("id", whitepaper.id);
      }
    });

    // Start processing in background
    Promise.all(processingPromises).catch((error) => {
      console.error("❌ [RETRY] Error in background processing:", error);
    });

    console.log("✅ [RETRY] Retry processing initiated successfully");

    return NextResponse.json({
      success: true,
      message: `Retry processing initiated for ${whitepapers.length} whitepaper(s)`,
      processedCount: whitepapers.length,
    });
  } catch (error) {
    console.error("❌ [RETRY] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
