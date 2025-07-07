// Pinecone Search Tool for LangGraph Agents
import { Pinecone } from "@pinecone-database/pinecone";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { pinecone } from "../pinecone"; // Use existing Pinecone client
import { supabase } from "../supabase"; // Import Supabase client

// Initialize Pinecone client
const pineconeClient = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Tool input schema
const PineconeSearchSchema = z.object({
  query: z
    .string()
    .describe("The search query to find relevant content from the whitepaper"),
  namespace: z
    .string()
    .describe("The Pinecone namespace (whitepaper ID) to search in"),
  topK: z.number().default(5).describe("Number of top results to return"),
  filter: z.record(z.any()).optional().describe("Optional metadata filters"),
});

// Input schema for the search tool
const PineconeSearchInput = z.object({
  query: z.string().describe("The search query text"),
  whitepaperNamespace: z
    .string()
    .describe("The namespace of the whitepaper to search"),
  indexName: z.string().describe("The Pinecone index name to search"),
  topK: z
    .number()
    .max(15)
    .default(10)
    .describe("Number of results to retrieve"),
  topN: z.number().default(5).describe("Number of results after reranking"),
});

// Simplified search input for cases where we know the whitepaper name
const SimpleSearchInput = z.object({
  query: z.string().describe("The search query text"),
  whitepaperName: z.string().describe("The name of the whitepaper to search"),
  topK: z
    .number()
    .max(15)
    .default(10)
    .describe("Number of results to retrieve"),
  topN: z.number().default(5).describe("Number of results after reranking"),
});

// Output schema for search results
const PineconeSearchOutput = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      category: z.string().optional(),
      score: z.number(),
    })
  ),
  query: z.string(),
  totalResults: z.number(),
});

// Pinecone search tool
export const pineconeSearchTool = tool(
  async ({ query, whitepaperNamespace, indexName, topK, topN }) => {
    console.log(
      `🔍 Searching whitepaper: "${query}" in namespace: ${whitepaperNamespace}`
    );

    try {
      // Get the specific index using the dynamic index name
      const index = pinecone.index(indexName);

      // Use the official Pinecone searchRecords method with reranking
      const searchResponse = await index
        .namespace(whitepaperNamespace)
        .searchRecords({
          query: {
            topK: topK,
            inputs: { text: query },
          },
          fields: ["text", "category"],
          rerank: {
            model: "pinecone-rerank-v0",
            rankFields: ["text"],
            topN: topN,
          },
        });

      // Transform response to our format with proper typing
      const results =
        searchResponse.result?.hits?.map((hit: any) => ({
          id: hit._id as string,
          text: (hit.fields?.text as string) || "",
          category: (hit.fields?.category as string) || undefined,
          score: (hit._score as number) || 0,
        })) || [];

      console.log(
        `✅ Search complete: ${results.length} results, Usage: ${JSON.stringify(searchResponse.usage)}`
      );

      return JSON.stringify({
        results,
        query,
        totalResults: results.length,
      });
    } catch (error) {
      console.error("❌ Pinecone search error:", error);
      throw new Error(
        `Search failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
  {
    name: "search_whitepaper",
    description:
      "Search the uploaded whitepaper content using Pinecone vector database. Returns relevant text chunks from the whitepaper based on the query.",
    schema: PineconeSearchInput,
  }
);

// Simplified search tool that automatically looks up the config
export const simpleSearchTool = tool(
  async ({ query, whitepaperName, topK, topN }) => {
    console.log(
      `🔍 Simple search: "${query}" in whitepaper: ${whitepaperName}`
    );

    try {
      // Get the configuration for this whitepaper
      const config = await getWhitepaperConfig(whitepaperName);

      // Use the main search tool with the retrieved config
      const result = await pineconeSearchTool.invoke({
        query,
        whitepaperNamespace: config.namespace,
        indexName: config.indexName,
        topK,
        topN,
      });

      return result;
    } catch (error) {
      console.error("❌ Simple search error:", error);
      throw new Error(
        `Simple search failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
  {
    name: "simple_search_whitepaper",
    description:
      "Search a whitepaper by name - automatically looks up the correct Pinecone index and namespace from the database.",
    schema: SimpleSearchInput,
  }
);

// Helper function to get whitepaper configuration from database
export async function getWhitepaperConfig(
  whitepaperName: string
): Promise<{ namespace: string; indexName: string }> {
  console.log(`🔍 Getting config for whitepaper: ${whitepaperName}`);

  try {
    // Query whitepapers table to get namespace and reference_bucket_id
    // Search by filename that contains the whitepaper name
    const { data: whitepapers, error: whitepaperError } = await supabase
      .from("whitepapers")
      .select("pinecone_namespace, reference_bucket_id, filename")
      .ilike("filename", `%${whitepaperName}%`)
      .limit(1);

    if (whitepaperError) {
      throw new Error(
        `Database error querying whitepapers: ${whitepaperError.message}`
      );
    }

    if (!whitepapers || whitepapers.length === 0) {
      throw new Error(`No whitepaper found matching name: ${whitepaperName}`);
    }

    const whitepaper = whitepapers[0];
    console.log(
      `📄 Found whitepaper: ${whitepaper.filename} with namespace: ${whitepaper.pinecone_namespace}`
    );

    // Query reference_buckets table to get the index name
    const { data: bucket, error: bucketError } = await supabase
      .from("reference_buckets")
      .select("pinecone_index_name, name")
      .eq("id", whitepaper.reference_bucket_id)
      .single();

    if (bucketError) {
      throw new Error(
        `Database error querying reference buckets: ${bucketError.message}`
      );
    }

    if (!bucket) {
      throw new Error(
        `No reference bucket found for whitepaper: ${whitepaperName}`
      );
    }

    console.log(
      `🪣 Found bucket: ${bucket.name} with index: ${bucket.pinecone_index_name}`
    );

    const config = {
      namespace: whitepaper.pinecone_namespace,
      indexName: bucket.pinecone_index_name,
    };

    console.log(`✅ Config retrieved:`, config);
    return config;
  } catch (error) {
    console.error("❌ Error getting whitepaper config:", error);
    throw new Error(
      `Failed to get whitepaper config: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Helper function to get whitepaper configuration by ID
export async function getWhitepaperConfigById(
  whitepaperIdParam: string
): Promise<{ namespace: string; indexName: string }> {
  console.log(`🔍 Getting config for whitepaper ID: ${whitepaperIdParam}`);

  try {
    // Query whitepapers table to get namespace and reference_bucket_id by ID
    const { data: whitepaper, error: whitepaperError } = await supabase
      .from("whitepapers")
      .select("pinecone_namespace, reference_bucket_id, filename, title")
      .eq("id", whitepaperIdParam)
      .single();

    if (whitepaperError) {
      throw new Error(
        `Database error querying whitepapers: ${whitepaperError.message}`
      );
    }

    if (!whitepaper) {
      throw new Error(`No whitepaper found with ID: ${whitepaperIdParam}`);
    }

    console.log(
      `📄 Found whitepaper: ${whitepaper.title} (${whitepaper.filename}) with namespace: ${whitepaper.pinecone_namespace}`
    );

    // Query reference_buckets table to get the index name
    const { data: bucket, error: bucketError } = await supabase
      .from("reference_buckets")
      .select("pinecone_index_name, name")
      .eq("id", whitepaper.reference_bucket_id)
      .single();

    if (bucketError) {
      throw new Error(
        `Database error querying reference buckets: ${bucketError.message}`
      );
    }

    if (!bucket) {
      throw new Error(
        `No reference bucket found for whitepaper ID: ${whitepaperIdParam}`
      );
    }

    console.log(
      `🪣 Found bucket: ${bucket.name} with index: ${bucket.pinecone_index_name}`
    );

    const config = {
      namespace: whitepaper.pinecone_namespace,
      indexName: bucket.pinecone_index_name,
    };

    console.log(`✅ Config retrieved:`, config);
    return config;
  } catch (error) {
    console.error("❌ Error getting whitepaper config by ID:", error);
    throw new Error(
      `Failed to get whitepaper config: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Helper function to list available whitepapers for debugging
export async function listAvailableWhitepapers(): Promise<
  Array<{ name: string; namespace: string; bucketName: string }>
> {
  console.log(`📋 Listing available whitepapers`);

  try {
    const { data: whitepapers, error } = await supabase.from("whitepapers")
      .select(`
        filename,
        pinecone_namespace,
        reference_buckets!inner(name)
      `);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const result =
      whitepapers?.map((wp) => ({
        name: wp.filename,
        namespace: wp.pinecone_namespace,
        bucketName: (wp.reference_buckets as any).name,
      })) || [];

    console.log(`📋 Found ${result.length} whitepapers:`, result);
    return result;
  } catch (error) {
    console.error("❌ Error listing whitepapers:", error);
    throw new Error(
      `Failed to list whitepapers: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Type exports
export type PineconeSearchResult = z.infer<typeof PineconeSearchOutput>;
export type WhitepaperConfig = { namespace: string; indexName: string };
export type PineconeSearchInput = z.infer<typeof PineconeSearchInput>;
export type SimpleSearchInput = z.infer<typeof SimpleSearchInput>;
