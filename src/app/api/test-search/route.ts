import { NextRequest, NextResponse } from "next/server";
import {
  getWhitepaperConfig,
  listAvailableWhitepapers,
  pineconeSearchTool,
} from "../../../lib/tools/pinecone-search";

export async function GET(req: NextRequest) {
  try {
    console.log("🧪 Testing Pinecone search tool integration");

    // Test 1: List available whitepapers
    console.log("📋 Step 1: Listing available whitepapers...");
    const whitepapers = await listAvailableWhitepapers();

    if (whitepapers.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No whitepapers found in database. Upload a whitepaper first.",
        whitepapers: [],
      });
    }

    // Test 2: Get config for the first whitepaper
    const firstWhitepaper = whitepapers[0];
    console.log(`🔧 Step 2: Getting config for: ${firstWhitepaper.name}`);

    const config = await getWhitepaperConfig(firstWhitepaper.name);
    console.log(`✅ Config retrieved:`, config);

    // Test 3: Perform a test search
    console.log(`🔍 Step 3: Performing test search...`);
    const searchResult = await pineconeSearchTool.invoke({
      query: "key insights",
      whitepaperNamespace: config.namespace,
      indexName: config.indexName,
      topK: 3,
      topN: 2,
    });

    return NextResponse.json({
      success: true,
      message: "Pinecone search tool test completed",
      data: {
        availableWhitepapers: whitepapers,
        testConfig: config,
        testSearch: JSON.parse(searchResult),
      },
    });
  } catch (error) {
    console.error("❌ Test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Pinecone search tool test failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, whitepaperName } = body;

    if (!query || !whitepaperName) {
      return NextResponse.json(
        { error: "Missing required fields: query, whitepaperName" },
        { status: 400 }
      );
    }

    console.log(
      `🔍 Custom search: "${query}" in whitepaper: ${whitepaperName}`
    );

    // Get configuration for the specified whitepaper
    const config = await getWhitepaperConfig(whitepaperName);

    // Perform the search
    const searchResult = await pineconeSearchTool.invoke({
      query,
      whitepaperNamespace: config.namespace,
      indexName: config.indexName,
      topK: 10,
      topN: 5,
    });

    return NextResponse.json({
      success: true,
      data: {
        config,
        results: JSON.parse(searchResult),
      },
    });
  } catch (error) {
    console.error("❌ Custom search failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
