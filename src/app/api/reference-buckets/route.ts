import { NextRequest, NextResponse } from "next/server";
import { supabase, type ReferenceBucket } from "@/lib/supabase";
import { createPineconeIndex } from "@/lib/pinecone";
import { v4 as uuidv4 } from "uuid";
import { Pinecone } from "@pinecone-database/pinecone";

// Types
interface CreateBucketRequest {
  name: string;
  description?: string;
}

// GET - List all reference buckets
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Fetching reference buckets...");

    const { data: buckets, error } = await supabase
      .from("reference_buckets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Database error:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`✅ Retrieved ${buckets?.length || 0} buckets`);

    return NextResponse.json({
      success: true,
      buckets: buckets || [],
    });
  } catch (error) {
    console.error("❌ Error fetching buckets:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST - Create new reference bucket
export async function POST(request: NextRequest) {
  try {
    console.log("🔨 Creating new reference bucket...");

    const body = await request.json();
    const { name, description, pinecone_index_name } = body;

    // Validate required fields
    if (!name || !pinecone_index_name) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and Pinecone index name are required",
        },
        { status: 400 }
      );
    }

    console.log(
      `📝 Creating bucket: ${name} with index: ${pinecone_index_name}`
    );

    // Create the bucket in database
    const { data: bucket, error } = await supabase
      .from("reference_buckets")
      .insert([
        {
          name,
          description: description || null,
          pinecone_index_name,
          status: "creating",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Database error:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`✅ Bucket created successfully: ${bucket.id}`);

    // 🚀 PHASE 2 FIX: Trigger async Pinecone index creation
    // This runs in the background and updates bucket status when complete
    createPineconeIndexAsync(bucket.id, pinecone_index_name);

    console.log(
      `🔄 Initiated Pinecone index creation for: ${pinecone_index_name}`
    );

    return NextResponse.json({
      success: true,
      message:
        "Reference bucket created successfully. Pinecone index creation in progress.",
      bucket,
    });
  } catch (error) {
    console.error("❌ Error creating bucket:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a reference bucket
export async function DELETE(request: NextRequest) {
  try {
    console.log("🗑️ Deleting reference bucket...");

    const { searchParams } = new URL(request.url);
    const bucketId = searchParams.get("id");

    if (!bucketId) {
      return NextResponse.json(
        {
          success: false,
          error: "Bucket ID is required",
        },
        { status: 400 }
      );
    }

    console.log(`📋 Looking up bucket: ${bucketId}`);

    // First, get the bucket to retrieve the Pinecone index name
    const { data: bucket, error: fetchError } = await supabase
      .from("reference_buckets")
      .select("*")
      .eq("id", bucketId)
      .single();

    if (fetchError || !bucket) {
      console.error("❌ Bucket not found:", fetchError);
      return NextResponse.json(
        {
          success: false,
          error: "Bucket not found",
        },
        { status: 404 }
      );
    }

    console.log(
      `📄 Found bucket: ${bucket.name} with index: ${bucket.pinecone_index_name}`
    );

    // Step 1: Delete from Pinecone first
    try {
      console.log(`🔍 Initializing Pinecone client...`);

      if (!process.env.PINECONE_API_KEY) {
        throw new Error("PINECONE_API_KEY environment variable is not set");
      }

      const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
      });

      console.log(`🗑️ Deleting Pinecone index: ${bucket.pinecone_index_name}`);

      await pinecone.deleteIndex(bucket.pinecone_index_name);

      console.log(
        `✅ Successfully deleted Pinecone index: ${bucket.pinecone_index_name}`
      );
    } catch (pineconeError) {
      console.error("❌ Failed to delete Pinecone index:", pineconeError);

      // Check if the error is because the index doesn't exist
      const errorMessage =
        pineconeError instanceof Error
          ? pineconeError.message
          : String(pineconeError);
      if (
        errorMessage.toLowerCase().includes("not found") ||
        errorMessage.toLowerCase().includes("404")
      ) {
        console.log(
          "⚠️ Pinecone index not found - proceeding with database deletion"
        );
      } else {
        // If it's a real error, don't proceed with database deletion
        return NextResponse.json(
          {
            success: false,
            error: `Failed to delete Pinecone index: ${errorMessage}`,
          },
          { status: 500 }
        );
      }
    }

    // Step 2: Delete from Supabase (this will cascade delete associated whitepapers)
    console.log(`🗑️ Deleting bucket from database: ${bucketId}`);

    const { error: deleteError } = await supabase
      .from("reference_buckets")
      .delete()
      .eq("id", bucketId);

    if (deleteError) {
      console.error("❌ Failed to delete bucket from database:", deleteError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to delete bucket from database: ${deleteError.message}`,
        },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully deleted bucket: ${bucket.name}`);

    return NextResponse.json({
      success: true,
      message: `Bucket "${bucket.name}" and associated Pinecone index deleted successfully`,
    });
  } catch (error) {
    console.error("❌ Error deleting bucket:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// 🚀 PHASE 2 FIX: Enhanced async function to create Pinecone index and update bucket status
async function createPineconeIndexAsync(bucketId: string, indexName: string) {
  try {
    console.log(
      `🔄 [ASYNC] Starting Pinecone index creation for bucket ${bucketId}`
    );
    console.log(`📝 [ASYNC] Index name: ${indexName}`);

    const result = await createPineconeIndex(indexName);

    if (result.success) {
      // Update bucket status to 'active'
      const { error } = await supabase
        .from("reference_buckets")
        .update({
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", bucketId);

      if (error) {
        console.error(
          `❌ [ASYNC] Failed to update bucket ${bucketId} status to active:`,
          error
        );
      } else {
        console.log(
          `✅ [ASYNC] Bucket ${bucketId} with Pinecone index ${indexName} created successfully and marked as active`
        );
      }
    } else {
      // Update bucket status to 'failed'
      const { error } = await supabase
        .from("reference_buckets")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", bucketId);

      if (error) {
        console.error(
          `❌ [ASYNC] Failed to update bucket ${bucketId} status to failed:`,
          error
        );
      }

      console.error(
        `❌ [ASYNC] Failed to create Pinecone index for bucket ${bucketId}:`,
        result.error
      );
    }
  } catch (error) {
    console.error(
      `❌ [ASYNC] Unexpected error in Pinecone index creation for bucket ${bucketId}:`,
      error
    );

    // Update bucket status to 'failed' with error details
    try {
      await supabase
        .from("reference_buckets")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", bucketId);

      console.log(
        `🔄 [ASYNC] Marked bucket ${bucketId} as failed due to error`
      );
    } catch (updateError) {
      console.error(
        `❌ [ASYNC] Failed to update bucket ${bucketId} status to failed:`,
        updateError
      );
    }
  }
}
