import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { deletePineconeNamespace } from "@/lib/pinecone";

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

// DELETE - Delete a whitepaper (from Supabase storage, database, and Pinecone namespace)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const whitepaperIds = searchParams.get("ids");

    if (!whitepaperIds) {
      return NextResponse.json(
        { success: false, error: "Whitepaper IDs are required" },
        { status: 400 }
      );
    }

    const idsArray = whitepaperIds.split(",");
    console.log(
      `🗑️ [DELETE] Starting deletion process for whitepapers: ${idsArray.join(", ")}`
    );

    const deletionResults = [];

    for (const whitepaperIdraw of idsArray) {
      const whitepapers = whitepaperIdraw.trim();
      console.log(`🔍 [DELETE] Processing whitepaper: ${whitepapers}`);

      try {
        // 1. Get whitepaper details including reference bucket info
        const { data: whitepaper, error: fetchError } = await supabase
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
          .eq("id", whitepapers)
          .single();

        if (fetchError || !whitepaper) {
          console.error(
            `❌ [DELETE] Failed to fetch whitepaper ${whitepapers}:`,
            fetchError
          );
          deletionResults.push({
            id: whitepapers,
            success: false,
            error: "Whitepaper not found",
          });
          continue;
        }

        console.log(`📋 [DELETE] Found whitepaper: ${whitepaper.filename}`);
        console.log(
          `📋 [DELETE] Reference bucket: ${whitepaper.reference_buckets?.name}`
        );
        console.log(
          `📋 [DELETE] Pinecone index: ${whitepaper.reference_buckets?.pinecone_index_name}`
        );
        console.log(
          `📋 [DELETE] Pinecone namespace: ${whitepaper.pinecone_namespace}`
        );

        // 2. Delete file from Supabase storage
        console.log(
          `🗑️ [DELETE] Deleting file from storage: ${whitepaper.filename}`
        );
        const { error: storageError } = await supabase.storage
          .from("whitepapers")
          .remove([whitepaper.filename]);

        if (storageError) {
          console.warn(
            `⚠️ [DELETE] Warning: Failed to delete file from storage:`,
            storageError
          );
          // Continue with deletion even if storage fails
        } else {
          console.log(`✅ [DELETE] File deleted from storage successfully`);
        }

        // 3. Delete namespace from Pinecone
        if (
          whitepaper.reference_buckets?.pinecone_index_name &&
          whitepaper.pinecone_namespace
        ) {
          console.log(
            `🗑️ [DELETE] Deleting Pinecone namespace: ${whitepaper.pinecone_namespace}`
          );
          const pineconeResult = await deletePineconeNamespace(
            whitepaper.reference_buckets.pinecone_index_name,
            whitepaper.pinecone_namespace
          );

          if (!pineconeResult.success) {
            console.warn(
              `⚠️ [DELETE] Warning: Failed to delete Pinecone namespace:`,
              pineconeResult.error
            );
            // Continue with deletion even if Pinecone fails
          } else {
            console.log(`✅ [DELETE] Pinecone namespace deleted successfully`);
          }
        }

        // 4. Delete record from database
        console.log(`🗑️ [DELETE] Deleting whitepaper record from database`);
        const { error: dbError } = await supabase
          .from("whitepapers")
          .delete()
          .eq("id", whitepapers);

        if (dbError) {
          console.error(
            `❌ [DELETE] Failed to delete whitepaper from database:`,
            dbError
          );
          deletionResults.push({
            id: whitepapers,
            success: false,
            error: "Failed to delete from database",
          });
          continue;
        }

        console.log(
          `✅ [DELETE] Whitepaper ${whitepaper.filename} deleted successfully`
        );
        deletionResults.push({
          id: whitepapers,
          success: true,
        });
      } catch (error) {
        console.error(
          `❌ [DELETE] Error deleting whitepaper ${whitepapers}:`,
          error
        );
        deletionResults.push({
          id: whitepapers,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = deletionResults.filter((r) => r.success).length;
    const totalCount = deletionResults.length;

    console.log(
      `🎉 [DELETE] Deletion complete: ${successCount}/${totalCount} successful`
    );

    return NextResponse.json({
      success: successCount > 0,
      message: `${successCount}/${totalCount} whitepapers deleted successfully`,
      results: deletionResults,
    });
  } catch (error) {
    console.error("❌ [DELETE] Error in deletion process:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete whitepapers",
      },
      { status: 500 }
    );
  }
}
