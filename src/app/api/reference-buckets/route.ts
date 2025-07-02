import { NextResponse } from "next/server";
import { supabase, type ReferenceBucket } from "@/lib/supabase";
import { createPineconeIndex } from "@/lib/pinecone";
import { v4 as uuidv4 } from "uuid";

// Types
interface CreateBucketRequest {
  name: string;
  description?: string;
}

// GET - List all reference buckets
export async function GET() {
  try {
    const { data: buckets, error } = await supabase
      .from("reference_buckets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error fetching buckets:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch reference buckets" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      buckets: buckets || [],
    });
  } catch (error) {
    console.error("Error fetching reference buckets:", error);

    // Ensure we always return JSON, never HTML
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to fetch reference buckets";

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

// POST - Create new reference bucket
export async function POST(request: Request) {
  try {
    const body: CreateBucketRequest = await request.json();
    const { name, description = "" } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Bucket name is required" },
        { status: 400 }
      );
    }

    // Generate unique identifiers
    const bucketId = uuidv4();
    const indexName = `contentflow-${Date.now()}-${bucketId.substring(0, 8)}`;

    console.log("Creating reference bucket:", {
      id: bucketId,
      name: name.trim(),
      description,
      indexName,
    });

    // Step 1: Insert bucket into Supabase with 'creating' status
    const { data: bucket, error: supabaseError } = await supabase
      .from("reference_buckets")
      .insert({
        id: bucketId,
        name: name.trim(),
        description: description || null,
        pinecone_index_name: indexName,
        status: "creating",
        whitepaper_count: 0,
      })
      .select()
      .single();

    if (supabaseError) {
      console.error("Supabase error creating bucket:", supabaseError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create reference bucket in database",
        },
        { status: 500 }
      );
    }

    // Step 2: Create Pinecone index asynchronously
    // We'll start the process and update the status afterwards
    createPineconeIndexAsync(bucketId, indexName);

    return NextResponse.json({
      success: true,
      bucket,
      message:
        "Reference bucket creation started. Pinecone index is being created.",
    });
  } catch (error) {
    console.error("Error creating reference bucket:", error);

    // Ensure we always return JSON, never HTML
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to create reference bucket";

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

// Async function to create Pinecone index and update bucket status
async function createPineconeIndexAsync(bucketId: string, indexName: string) {
  try {
    console.log(`Starting Pinecone index creation for bucket ${bucketId}`);

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
          `Failed to update bucket ${bucketId} status to active:`,
          error
        );
      } else {
        console.log(
          `Bucket ${bucketId} with Pinecone index ${indexName} created successfully`
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
          `Failed to update bucket ${bucketId} status to failed:`,
          error
        );
      }

      console.error(
        `Failed to create Pinecone index for bucket ${bucketId}:`,
        result.error
      );
    }
  } catch (error) {
    console.error(
      `Error in async Pinecone index creation for bucket ${bucketId}:`,
      error
    );

    // Update bucket status to 'failed'
    await supabase
      .from("reference_buckets")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bucketId);
  }
}
