/**
 * Whitepaper Processing Pipeline
 *
 * This module implements the complete document processing pipeline:
 * 1. Extract text from PDF/DOCX
 * 2. Split into 800-token chunks
 * 3. Enhance each chunk with contextual information using GPT-4.1-nano
 * 4. Upsert to Pinecone using llama-text-embed-v2 inference
 */

import { supabase } from "./supabase";
import { pinecone } from "./pinecone";
import { encoding_for_model } from "tiktoken";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import { Poppler } from "node-poppler";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import path from "path";

// Types
interface ProcessingContext {
  whitepaperID: string;
  filename: string;
  fileUrl: string;
  namespace: string;
}

interface DocumentChunk {
  id: string;
  text: string;
  original_text: string;
  context: string;
  position: number;
  token_count: number;
}

interface ProcessingResult {
  success: boolean;
  chunkCount?: number;
  error?: string;
}

interface WhitepaperChunk {
  id: string;
  text: string;
  original_text: string;
  context: string;
  chunk_index: number;
}

// Configuration
const CHUNK_SIZE = 1600; // tokens per chunk
const CONTEXTUAL_PROMPT = `<document>
{DOCUMENT_TEXT}
</document>

Here is the chunk we want to situate within the whole document
<chunk>
{CHUNK_TEXT}
</chunk>

Please give a short succinct context to situate this chunk within the overall document for the purposes of improving search retrieval of the chunk. Answer only with the succinct context and nothing else.`;

// Initialize OpenAI (will use environment variable API key)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize tiktoken encoder for token counting
const encoder = encoding_for_model("gpt-4");

/**
 * Main processing function - implements the pipeline from tech spec
 */
export async function processWhitepaper(
  whitepaperId: string,
  pdfBuffer: Buffer
): Promise<ProcessingResult> {
  console.log(
    `🚀 [PROCESSOR] Starting processing for whitepaper: ${whitepaperId}`
  );
  console.log(`📄 [PROCESSOR] PDF buffer size: ${pdfBuffer.length} bytes`);

  try {
    // Update status to processing
    console.log(`📊 [PROCESSOR] Updating status to 'processing'`);
    await updateWhitepaperStatus(whitepaperId, "processing");

    // Extract text from PDF
    console.log(`🔍 [PROCESSOR] Starting PDF text extraction`);
    const documentText = await extractTextFromPDF(pdfBuffer);
    console.log(
      `✅ [PROCESSOR] Text extraction complete. Document length: ${documentText.length} characters`
    );

    if (documentText.length < 100) {
      throw new Error("Document too short or empty");
    }

    // Split into chunks
    console.log(`✂️ [PROCESSOR] Starting document chunking`);
    const textChunks = splitIntoChunks(documentText, 800);
    console.log(
      `✅ [PROCESSOR] Chunking complete. Generated ${textChunks.length} chunks`
    );

    if (textChunks.length === 0) {
      throw new Error("No chunks generated from document");
    }

    // Generate contextual information for each chunk
    console.log(
      `🧠 [PROCESSOR] Starting contextual enhancement for ${textChunks.length} chunks`
    );
    const contextualizedChunks: WhitepaperChunk[] = [];

    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      console.log(
        `🔄 [PROCESSOR] Processing chunk ${i + 1}/${textChunks.length} (${chunk.length} chars)`
      );

      const context = await generateChunkContext(chunk, documentText);

      contextualizedChunks.push({
        id: `${whitepaperId}-chunk-${i}`,
        text: chunk, // Store original chunk text, contextualization happens in Pinecone upsert
        original_text: chunk,
        context: context,
        chunk_index: i,
      });

      console.log(
        `✅ [PROCESSOR] Chunk ${i + 1} processed. Context: "${context.substring(0, 50)}..."`
      );

      // Add small delay to avoid rate limiting
      if (i < textChunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    console.log(`✅ [PROCESSOR] All chunks contextualized successfully`);

    // Get whitepaper metadata for Pinecone upsert
    console.log(`📋 [PROCESSOR] Fetching whitepaper metadata from database`);
    const whitepaper = await getWhitepaperFromDB(whitepaperId);

    // Generate Pinecone-compliant namespace from document filename
    const namespace = makePineconeCompliantNamespace(whitepaper.filename);

    // Get index name from reference bucket
    const indexName =
      whitepaper.reference_buckets?.pinecone_index_name ||
      "contentflow-default";

    console.log(
      `✅ [PROCESSOR] Metadata retrieved. Index: ${indexName}, Namespace: ${namespace}`
    );

    // Upsert to Pinecone
    console.log(`📤 [PROCESSOR] Starting Pinecone upsert`);
    await upsertToPinecone(indexName, namespace, contextualizedChunks);
    console.log(`✅ [PROCESSOR] Pinecone upsert completed successfully`);

    // Update status to completed
    console.log(`📊 [PROCESSOR] Updating status to 'completed'`);
    await updateWhitepaperStatus(
      whitepaperId,
      "completed",
      contextualizedChunks.length
    );

    console.log(
      `🎉 [PROCESSOR] Successfully processed whitepaper ${whitepaperId} with ${contextualizedChunks.length} chunks`
    );

    return {
      success: true,
      chunkCount: contextualizedChunks.length,
    };
  } catch (error) {
    console.error(
      `❌ [PROCESSOR] Processing failed for whitepaper ${whitepaperId}:`,
      error
    );

    // Update status to failed
    console.log(`📊 [PROCESSOR] Updating status to 'failed'`);
    await updateWhitepaperStatus(whitepaperId, "failed");

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Extract text content from PDF buffer
 */
async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  console.log(
    `🔍 [PDF] Starting PDF text extraction from ${pdfBuffer.length} byte buffer`
  );

  // Create temporary file for poppler processing
  const tempFileName = `temp-pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.pdf`;
  const tempFilePath = path.join(tmpdir(), tempFileName);

  try {
    console.log(
      `📚 [PDF] Using node-poppler library (production-grade PDF extraction)`
    );

    // Write buffer to temporary file
    console.log(`💾 [PDF] Writing buffer to temporary file: ${tempFilePath}`);
    writeFileSync(tempFilePath, pdfBuffer);

    // Initialize Poppler with explicit path to binaries
    const poppler = new Poppler("/usr/local/bin");

    // Extract text using pdfToText
    console.log(`⚙️ [PDF] Extracting text using Poppler pdfToText`);
    const textResult = await poppler.pdfToText(tempFilePath);

    if (!textResult || textResult.trim().length === 0) {
      throw new Error("No text content found in PDF");
    }

    // Clean up the extracted text
    const cleanText = textResult
      .replace(/\s+/g, " ") // Normalize multiple spaces to single space
      .replace(/\n\s*\n/g, "\n\n") // Clean up excessive line breaks
      .trim();

    console.log(
      `✅ [PDF] Successfully extracted ${cleanText.length} characters from PDF`
    );
    console.log(
      `📋 [PDF] First 200 chars: "${cleanText.substring(0, 200)}..."`
    );

    return cleanText;
  } catch (error) {
    console.error("❌ [PDF] PDF text extraction failed:", error);
    throw new Error(
      `PDF extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  } finally {
    // Clean up temporary file
    try {
      console.log(`🗑️ [PDF] Cleaning up temporary file: ${tempFilePath}`);
      unlinkSync(tempFilePath);
    } catch (cleanupError) {
      console.warn(`⚠️ [PDF] Failed to clean up temporary file:`, cleanupError);
    }
  }
}

/**
 * Split text into chunks of approximately maxTokens size, respecting sentence boundaries
 */
function splitIntoChunks(text: string, maxTokens: number = 800): string[] {
  console.log(
    `✂️ [CHUNKER] Splitting text (${text.length} chars) into chunks of max ${maxTokens} tokens`
  );

  // Split by sentences first
  const sentences = text.split(/(?<=[.!?])\s+/);
  console.log(`📝 [CHUNKER] Split into ${sentences.length} sentences`);

  const chunks: string[] = [];
  let currentChunk = "";

  for (
    let sentenceIndex = 0;
    sentenceIndex < sentences.length;
    sentenceIndex++
  ) {
    const sentence = sentences[sentenceIndex];
    const testChunk = currentChunk + (currentChunk ? " " : "") + sentence;
    const tokenCount = encoder.encode(testChunk).length;

    console.log(
      `🔍 [CHUNKER] Sentence ${sentenceIndex + 1}: ${sentence.length} chars, test chunk tokens: ${tokenCount}`
    );

    if (tokenCount <= maxTokens) {
      currentChunk = testChunk;
    } else {
      // If current chunk has content, save it and start new chunk
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        console.log(
          `✅ [CHUNKER] Chunk ${chunks.length} created: ${currentChunk.length} chars, ${encoder.encode(currentChunk).length} tokens`
        );
        currentChunk = sentence;
      } else {
        // If single sentence is too long, split by words
        console.log(
          `⚠️ [CHUNKER] Single sentence too long, splitting by words`
        );
        const words = sentence.split(" ");
        let wordChunk = "";

        for (const word of words) {
          const testWordChunk = wordChunk + (wordChunk ? " " : "") + word;
          if (encoder.encode(testWordChunk).length <= maxTokens) {
            wordChunk = testWordChunk;
          } else {
            if (wordChunk) {
              chunks.push(wordChunk.trim());
              console.log(
                `✅ [CHUNKER] Word-split chunk ${chunks.length} created: ${wordChunk.length} chars`
              );
              wordChunk = word;
            } else {
              // Single word is too long, just add it
              chunks.push(word);
              console.log(
                `⚠️ [CHUNKER] Single word too long, added as chunk: ${word.length} chars`
              );
            }
          }
        }
        if (wordChunk) {
          currentChunk = wordChunk;
        }
      }
    }
  }

  // Add final chunk if it has content
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
    console.log(
      `✅ [CHUNKER] Final chunk created: ${currentChunk.length} chars, ${encoder.encode(currentChunk).length} tokens`
    );
  }

  console.log(`✅ [CHUNKER] Chunking complete: ${chunks.length} total chunks`);
  return chunks;
}

/**
 * Generate contextual information for a chunk using GPT-4.1 nano
 */
async function generateChunkContext(
  chunk: string,
  fullDocument: string
): Promise<string> {
  console.log(
    `🧠 [CONTEXT] Generating context for chunk (${chunk.length} chars)`
  );

  const contextPrompt = `<document>
${fullDocument}
</document>

Here is the chunk we want to situate within the whole document
<chunk>
${chunk}
</chunk>

Please give a short succinct context to situate this chunk within the overall document for the purposes of improving search retrieval of the chunk. Answer only with the succinct context and nothing else.`;

  try {
    console.log(`🤖 [CONTEXT] Calling OpenAI API for context generation`);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using gpt-4o-mini for reliable context generation
      messages: [{ role: "user", content: contextPrompt }],
      max_tokens: 100,
      temperature: 0.3,
    });

    const context = response.choices[0]?.message?.content?.trim() || "";
    console.log(`✅ [CONTEXT] Generated context: "${context}"`);
    return context;
  } catch (error) {
    console.error("❌ [CONTEXT] Failed to generate context for chunk:", error);
    return ""; // Return empty context if generation fails
  }
}

/**
 * Upsert chunks to Pinecone with integrated embeddings (text-based)
 * Uses the text upsert API where Pinecone handles embedding generation automatically
 */
async function upsertToPinecone(
  indexName: string,
  namespace: string,
  chunks: WhitepaperChunk[]
): Promise<void> {
  console.log(
    `📤 [PINECONE] Starting text-based upsert: ${chunks.length} chunks to index '${indexName}', namespace '${namespace}'`
  );

  try {
    console.log(`🔗 [PINECONE] Getting Pinecone index instance`);
    const index = pinecone.index(indexName);

    // Prepare records for text-based upsert
    console.log(`⚙️ [PINECONE] Preparing text records for upsert`);
    const records = chunks.map((chunk, i) => {
      console.log(
        `📋 [PINECONE] Preparing record ${i + 1}/${chunks.length}: ${chunk.id}`
      );

      // Combine original text with context for better embeddings
      const enhancedText = chunk.context
        ? `${chunk.context} ------- ${chunk.text}`
        : chunk.text;

      return {
        _id: chunk.id,
        text: enhancedText, // This field will be embedded by Pinecone
        original_text: chunk.original_text,
        context: chunk.context,
        chunk_index: chunk.chunk_index,
        enhanced_text: enhancedText, // Store the enhanced version for reference
      };
    });

    console.log(`✅ [PINECONE] All text records prepared`);

    // Upsert in batches of 96 (limit for text upserts)
    const batchSize = 96; // Text upsert limit according to Pinecone docs
    const totalBatches = Math.ceil(records.length / batchSize);

    console.log(
      `📦 [PINECONE] Upserting text records in batches of ${batchSize}. Total batches: ${totalBatches}`
    );

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;

      console.log(
        `📤 [PINECONE] Upserting text batch ${batchNumber}/${totalBatches} (${batch.length} records)`
      );

      try {
        // Use the text-based upsert method for integrated embedding
        await index.namespace(namespace).upsertRecords(batch);
        console.log(
          `✅ [PINECONE] Text batch ${batchNumber} upserted successfully with integrated embedding`
        );
      } catch (batchError) {
        console.error(
          `❌ [PINECONE] Text batch ${batchNumber} failed:`,
          batchError
        );
        console.error(
          `📋 [PINECONE] Batch data:`,
          JSON.stringify(batch.slice(0, 2), null, 2)
        ); // Log first 2 records for debugging
        throw batchError;
      }
    }

    console.log(
      "🎉 [PINECONE] Successfully upserted all text chunks to Pinecone with integrated embeddings"
    );
  } catch (error) {
    console.error("❌ [PINECONE] Pinecone text upsert failed:", error);
    throw new Error(
      `Failed to upsert text to Pinecone: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Update whitepaper status in database
 */
async function updateWhitepaperStatus(
  whitepaperId: string,
  status: "uploading" | "processing" | "completed" | "failed",
  chunkCount?: number
): Promise<void> {
  console.log(
    `📊 [DATABASE] Updating whitepaper ${whitepaperId} status to '${status}'${chunkCount ? ` with ${chunkCount} chunks` : ""}`
  );

  try {
    const updateData: any = {
      processing_status: status,
      updated_at: new Date().toISOString(),
    };

    if (chunkCount !== undefined) {
      updateData.chunk_count = chunkCount;
      console.log(`📊 [DATABASE] Including chunk count: ${chunkCount}`);
    }

    const { error } = await supabase
      .from("whitepapers")
      .update(updateData)
      .eq("id", whitepaperId);

    if (error) {
      console.error("❌ [DATABASE] Failed to update whitepaper status:", error);
      throw error;
    }

    console.log(
      `✅ [DATABASE] Successfully updated whitepaper ${whitepaperId} status to ${status}`
    );
  } catch (error) {
    console.error("❌ [DATABASE] Database update failed:", error);
    throw error;
  }
}

/**
 * Get whitepaper from database with reference bucket information
 */
async function getWhitepaperFromDB(whitepaperId: string) {
  console.log(
    `📋 [DATABASE] Fetching whitepaper metadata with reference bucket for ID: ${whitepaperId}`
  );

  try {
    // Join with reference_buckets to get the pinecone_index_name
    const { data, error } = await supabase
      .from("whitepapers")
      .select(
        `
        *,
        reference_buckets!inner(
          id,
          name,
          pinecone_index_name
        )
      `
      )
      .eq("id", whitepaperId)
      .single();

    if (error || !data) {
      console.error("❌ [DATABASE] Failed to fetch whitepaper:", error);
      throw new Error(
        `Failed to get whitepaper: ${error?.message || "Not found"}`
      );
    }

    console.log(`✅ [DATABASE] Whitepaper metadata retrieved successfully`);
    console.log(
      `📋 [DATABASE] Title: ${data.title}, Filename: ${data.filename}`
    );
    console.log(
      `📋 [DATABASE] Reference Bucket: ${data.reference_buckets.name}, Index: ${data.reference_buckets.pinecone_index_name}`
    );

    return data;
  } catch (error) {
    console.error("❌ [DATABASE] Database fetch failed:", error);
    throw error;
  }
}

/**
 * Utility function to generate unique chunk ID
 */
export function generateChunkId(): string {
  return uuidv4();
}

/**
 * Convert a document name to a Pinecone-compliant namespace name
 * Pinecone namespaces must be alphanumeric, hyphens, and underscores only
 */
function makePineconeCompliantNamespace(docName: string): string {
  console.log(
    `🔧 [NAMESPACE] Converting document name to Pinecone-compliant namespace: "${docName}"`
  );

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

  console.log(`✅ [NAMESPACE] Pinecone-compliant namespace: "${namespace}"`);
  return namespace;
}
