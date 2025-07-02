import { NextRequest, NextResponse } from "next/server";

/**
 * Convert a document name to a Pinecone-compliant namespace name
 * Pinecone namespaces must be alphanumeric, hyphens, and underscores only
 */
function makePineconeCompliantNamespace(docName: string): string {
  // Remove file extension
  let namespace = docName.replace(/\.[^/.]+$/, "");

  // Replace spaces and special characters with hyphens
  namespace = namespace.replace(/[^a-zA-Z0-9_-]/g, "-");

  // Remove multiple consecutive hyphens
  namespace = namespace.replace(/-+/g, "-");

  // Remove leading/trailing hyphens
  namespace = namespace.replace(/^-+|-+$/g, "");

  // Ensure it's not empty and not too long (max 100 chars)
  if (!namespace || namespace.length === 0) {
    namespace = "document";
  }

  if (namespace.length > 100) {
    namespace = namespace.substring(0, 100).replace(/-+$/, "");
  }

  // Ensure it doesn't start with a number (best practice)
  if (/^[0-9]/.test(namespace)) {
    namespace = "doc-" + namespace;
  }

  return namespace;
}

// POST - Upload whitepaper files
export async function POST(request: NextRequest) {
  console.log("🚀 [UPLOAD] Upload API called");

  try {
    // Check environment variables
    console.log("🔍 [UPLOAD] Checking environment variables...");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const pineconeKey = process.env.PINECONE_API_KEY;

    console.log(`📋 [UPLOAD] Environment check:`);
    console.log(`   - SUPABASE_URL: ${supabaseUrl ? "✅ Set" : "❌ Missing"}`);
    console.log(
      `   - SUPABASE_ANON_KEY: ${supabaseKey ? "✅ Set" : "❌ Missing"}`
    );
    console.log(`   - OPENAI_API_KEY: ${openaiKey ? "✅ Set" : "❌ Missing"}`);
    console.log(
      `   - PINECONE_API_KEY: ${pineconeKey ? "✅ Set" : "❌ Missing"}`
    );

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ [UPLOAD] Supabase configuration missing");
      return NextResponse.json(
        { error: "Server configuration error: Missing Supabase configuration" },
        { status: 500 }
      );
    }

    if (!openaiKey) {
      console.error(
        "❌ [UPLOAD] OPENAI_API_KEY environment variable is missing"
      );
      return NextResponse.json(
        { error: "Server configuration error: Missing OpenAI API key" },
        { status: 500 }
      );
    }

    if (!pineconeKey) {
      console.error(
        "❌ [UPLOAD] PINECONE_API_KEY environment variable is missing"
      );
      return NextResponse.json(
        { error: "Server configuration error: Missing Pinecone API key" },
        { status: 500 }
      );
    }

    console.log("✅ [UPLOAD] All environment variables present");

    // Parse form data
    console.log("📋 [UPLOAD] Parsing form data...");
    const formData = await request.formData();
    const bucketId = formData.get("bucketId") as string;
    const files = formData.getAll("files") as File[];

    console.log(
      `📊 [UPLOAD] Processing file upload: { bucketId: '${bucketId}', fileCount: ${files.length} }`
    );

    if (!bucketId) {
      console.error("❌ [UPLOAD] Bucket ID is required");
      return NextResponse.json(
        { error: "Bucket ID is required" },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      console.error("❌ [UPLOAD] No files provided");
      return NextResponse.json(
        { error: "At least one file is required" },
        { status: 400 }
      );
    }

    console.log("✅ [UPLOAD] Form data parsed successfully");

    // Initialize Supabase client
    console.log("🔗 [UPLOAD] Initializing Supabase client...");
    const { supabase } = await import("@/lib/supabase");

    // Process each file
    const uploadedFiles = [];
    const processingPromises = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(
        `📄 [UPLOAD] Processing file ${i + 1}/${files.length}: ${file.name} (${file.size} bytes, type: ${file.type})`
      );

      try {
        // Validate file
        if (!file.name || file.size === 0) {
          console.error(`❌ [UPLOAD] Invalid file: ${file.name || "unnamed"}`);
          throw new Error(`Invalid file: ${file.name || "unnamed"}`);
        }

        // Validate file type
        const allowedTypes = [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!allowedTypes.includes(file.type)) {
          console.error(
            `❌ [UPLOAD] Unsupported file type: ${file.type} for file ${file.name}`
          );
          throw new Error(
            `Unsupported file type: ${file.type}. Only PDF and DOCX files are allowed.`
          );
        }

        // Validate file size (50MB limit)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
          console.error(
            `❌ [UPLOAD] File too large: ${file.size} bytes for file ${file.name}`
          );
          throw new Error(
            `File too large: ${file.name}. Maximum size is 50MB.`
          );
        }

        console.log(`✅ [UPLOAD] File validation passed for ${file.name}`);

        // Convert file to buffer for processing
        console.log(`🔄 [UPLOAD] Converting ${file.name} to buffer...`);
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log(`✅ [UPLOAD] Buffer created: ${buffer.length} bytes`);

        // Generate unique filename to avoid conflicts
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileExtension = file.name.split(".").pop();
        const uniqueFileName = `${timestamp}-${randomSuffix}.${fileExtension}`;
        const storagePath = `whitepapers/${bucketId}/${uniqueFileName}`;

        console.log(
          `📤 [UPLOAD] Uploading ${file.name} to Supabase Storage as ${storagePath}...`
        );

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("whitepapers")
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error(
            `❌ [UPLOAD] Supabase Storage upload failed for ${file.name}:`,
            uploadError
          );
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        console.log(
          `✅ [UPLOAD] File uploaded to Supabase Storage: ${uploadData.path}`
        );

        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from("whitepapers")
          .getPublicUrl(storagePath);

        const fileUrl = urlData.publicUrl;
        console.log(`🔗 [UPLOAD] Public URL generated: ${fileUrl}`);

        // Generate Pinecone-compliant namespace for this document
        const pineconeNamespace = makePineconeCompliantNamespace(file.name);
        console.log(
          `🏷️ [UPLOAD] Generated Pinecone namespace: "${pineconeNamespace}"`
        );

        // Insert whitepaper record into database
        console.log(`💾 [UPLOAD] Creating database record for ${file.name}...`);

        const { data: whitepaper, error: insertError } = await supabase
          .from("whitepapers")
          .insert({
            title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
            filename: file.name,
            file_url: fileUrl,
            pinecone_namespace: pineconeNamespace, // Store the generated namespace
            file_size_bytes: file.size, // Use correct field name
            content_type: file.type, // Use correct field name
            processing_status: "uploading",
            reference_bucket_id: bucketId,
          })
          .select()
          .single();

        if (insertError) {
          console.error(
            `❌ [UPLOAD] Database insert failed for ${file.name}:`,
            insertError
          );

          // Clean up uploaded file if database insert fails
          console.log(
            `🧹 [UPLOAD] Cleaning up uploaded file due to database error...`
          );
          await supabase.storage.from("whitepapers").remove([storagePath]);

          throw new Error(`Database error: ${insertError.message}`);
        }

        console.log(
          `✅ [UPLOAD] Database record created for ${file.name}: ID ${whitepaper.id}`
        );

        uploadedFiles.push({
          id: whitepaper.id,
          name: file.name,
          url: fileUrl,
          status: "uploaded",
        });

        // Start processing in background
        console.log(
          `🔄 [UPLOAD] Starting background processing for ${file.name}...`
        );
        const processingPromise = processWhitepaperBackground(
          whitepaper.id,
          buffer
        );
        processingPromises.push(processingPromise);
      } catch (error) {
        console.error(`❌ [UPLOAD] Error processing file ${file.name}:`, error);

        uploadedFiles.push({
          name: file.name,
          status: "error",
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }

    console.log(
      `🎉 [UPLOAD] Upload process completed. ${uploadedFiles.length} files processed`
    );
    console.log(
      `🔄 [UPLOAD] ${processingPromises.length} background processing jobs started`
    );

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully. Processing started in background.`,
    });
  } catch (error) {
    console.error("❌ [UPLOAD] Critical upload error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.stack
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Process whitepaper in background without blocking the response
 */
async function processWhitepaperBackground(
  whitepaperId: string,
  pdfBuffer: Buffer
) {
  console.log(
    `🔄 [BACKGROUND] Starting background processing for whitepaper: ${whitepaperId}`
  );

  try {
    // Dynamic import to avoid build issues
    const { processWhitepaper } = await import("@/lib/whitepaper-processor");

    console.log(
      `⚙️ [BACKGROUND] Calling processWhitepaper for ${whitepaperId}`
    );
    const result = await processWhitepaper(whitepaperId, pdfBuffer);

    if (result.success) {
      console.log(
        `✅ [BACKGROUND] Processing completed successfully for ${whitepaperId}: ${result.chunkCount} chunks`
      );
    } else {
      console.error(
        `❌ [BACKGROUND] Processing failed for ${whitepaperId}:`,
        result.error
      );
    }

    return result;
  } catch (error) {
    console.error(
      `❌ [BACKGROUND] Critical background processing error for ${whitepaperId}:`,
      error
    );

    // Update status to failed
    try {
      const { supabase } = await import("@/lib/supabase");
      await supabase
        .from("whitepapers")
        .update({
          processing_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", whitepaperId);

      console.log(
        `📊 [BACKGROUND] Updated status to failed for ${whitepaperId}`
      );
    } catch (dbError) {
      console.error(
        `❌ [BACKGROUND] Failed to update status for ${whitepaperId}:`,
        dbError
      );
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Background processing failed",
    };
  }
}
