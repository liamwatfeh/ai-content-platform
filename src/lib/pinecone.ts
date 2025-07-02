import { Pinecone } from "@pinecone-database/pinecone";

const apiKey = process.env.PINECONE_API_KEY!;

if (!apiKey) {
  throw new Error("PINECONE_API_KEY environment variable is required");
}

// Initialize Pinecone client
export const pinecone = new Pinecone({
  apiKey: apiKey,
});

/**
 * Create a new Pinecone index with integrated embedding model
 * This allows us to upsert text directly without creating embeddings ourselves
 * - Model: llama-text-embed-v2 (Meta's LLaMA text embedding model)
 * - Capacity: Serverless
 * - Cloud: AWS
 * - Region: us-east-1 (Virginia)
 * - Dimension: 4096 (automatic based on model)
 * - Metric: cosine
 */
export async function createPineconeIndex(
  indexName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(
      `🔗 [PINECONE] Creating Pinecone index with integrated embedding: ${indexName}`
    );

    // Create index with integrated embedding model for text upserts
    // @ts-ignore - createIndexForModel might not be in types yet
    await pinecone.createIndexForModel({
      name: indexName,
      cloud: "aws",
      region: "us-east-1",
      embed: {
        model: "llama-text-embed-v2",
        fieldMap: { text: "text" }, // Map the field that contains text to be embedded
      },
      deletionProtection: "disabled", // Allow deletion for development
    });

    console.log(
      `✅ [PINECONE] Pinecone index created successfully with integrated embedding: ${indexName}`
    );
    return { success: true };
  } catch (error) {
    console.error(
      `❌ [PINECONE] Error creating Pinecone index ${indexName}:`,
      error
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error creating Pinecone index",
    };
  }
}

/**
 * Check if a Pinecone index exists and is ready
 */
export async function checkIndexStatus(
  indexName: string
): Promise<{ exists: boolean; ready: boolean; error?: string }> {
  try {
    console.log(`🔍 [PINECONE] Checking index status: ${indexName}`);
    const indexDescription = await pinecone.describeIndex(indexName);
    const isReady = indexDescription.status?.ready === true;

    console.log(
      `📊 [PINECONE] Index ${indexName} status: exists=true, ready=${isReady}`
    );
    return {
      exists: true,
      ready: isReady,
    };
  } catch (error: any) {
    if (error?.status === 404) {
      console.log(`📊 [PINECONE] Index ${indexName} does not exist`);
      return { exists: false, ready: false };
    }
    console.error(
      `❌ [PINECONE] Error checking index status for ${indexName}:`,
      error
    );
    return {
      exists: false,
      ready: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error checking index status",
    };
  }
}

/**
 * Delete a Pinecone index
 */
export async function deletePineconeIndex(
  indexName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🗑️ [PINECONE] Deleting Pinecone index: ${indexName}`);
    await pinecone.deleteIndex(indexName);
    console.log(
      `✅ [PINECONE] Pinecone index deleted successfully: ${indexName}`
    );
    return { success: true };
  } catch (error) {
    console.error(
      `❌ [PINECONE] Error deleting Pinecone index ${indexName}:`,
      error
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error deleting Pinecone index",
    };
  }
}

/**
 * Delete a namespace from a Pinecone index
 */
export async function deletePineconeNamespace(
  indexName: string,
  namespace: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(
      `🗑️ [PINECONE] Deleting namespace '${namespace}' from index: ${indexName}`
    );

    const index = pinecone.Index(indexName);
    await index.namespace(namespace).deleteAll();

    console.log(
      `✅ [PINECONE] Namespace '${namespace}' deleted successfully from index: ${indexName}`
    );
    return { success: true };
  } catch (error) {
    console.error(
      `❌ [PINECONE] Error deleting namespace '${namespace}' from index ${indexName}:`,
      error
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error deleting Pinecone namespace",
    };
  }
}

/**
 * Get a Pinecone index instance for data operations
 */
export function getPineconeIndex(indexName: string) {
  console.log(`🔗 [PINECONE] Getting index instance: ${indexName}`);
  return pinecone.Index(indexName);
}
