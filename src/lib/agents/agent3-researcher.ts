// Agent 3: Deep Research Agent
// Model: claude-sonnet-4-20250514 (Claude Sonnet 4 with thinking enabled)
// Purpose: Take selected theme and develop it into 6 compelling content concepts

import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";
import { pineconeSearchTool } from "../tools/pinecone-search";
import type { BasicWorkflowState, ResearchDossier } from "../schemas/types";
import { getWhitepaperConfigById } from "../tools/pinecone-search";
import { MessageContentText } from "@langchain/core/messages";
import { researchDossierParser } from "../tools/output-parsers";
import { StructuredOutputParser } from "@langchain/core/output_parsers";

// Type for search results
interface SearchResult {
  id: string;
  score?: number;
  text: string;
  category?: string;
}

// Schema for iterative research queries
const ResearchQueriesSchema = z
  .array(
    z
      .string()
      .describe(
        "Short, targeted keyword query (2-6 words max) for semantic search"
      )
  )
  .min(3)
  .max(5);
const researchQueriesParser = StructuredOutputParser.fromZodSchema(
  ResearchQueriesSchema
);

// Schema for concept development iteration
const ConceptDevelopmentSchema = z.object({
  analysis: z.string(),
  nextQueries: z
    .array(
      z.string().describe("Short keyword query (2-6 words) for RAG search")
    )
    .min(2)
    .max(4),
  emergingConcepts: z.array(
    z.object({
      angle: z.string(),
      reasoning: z.string(),
    })
  ),
});
const conceptDevelopmentParser = StructuredOutputParser.fromZodSchema(
  ConceptDevelopmentSchema
);

export async function deepResearchAgent(
  state: BasicWorkflowState
): Promise<Partial<BasicWorkflowState>> {
  console.log(
    "🔬 Agent 3: Deep Research Agent starting concept development..."
  );

  try {
    // Validate required inputs
    if (!state.selectedTheme) {
      throw new Error(
        "No theme selected. Agent 3 requires a selected theme to proceed."
      );
    }

    if (!state.selectedWhitepaperId) {
      throw new Error(
        "No whitepaper selected. Agent 3 requires whitepaper context."
      );
    }

    if (!state.marketingBrief) {
      throw new Error(
        "No marketing brief available. Agent 3 requires marketing context."
      );
    }

    // Initialize Claude Sonnet 4 model
    const llm = new ChatAnthropic({
      model: "claude-sonnet-4-20250514", // Claude Sonnet 4 with thinking enabled
      apiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 0.4, // Slightly higher for creativity
    });

    // Get whitepaper configuration
    console.log("🔍 Getting whitepaper configuration...");
    const whitepaperConfig = await getWhitepaperConfigById(
      state.selectedWhitepaperId
    );

    // Parse marketing brief
    let marketingBrief;
    try {
      marketingBrief =
        typeof state.marketingBrief === "string"
          ? JSON.parse(state.marketingBrief)
          : state.marketingBrief;
    } catch (error) {
      console.error("❌ Failed to parse marketing brief:", error);
      throw new Error("Invalid marketing brief format");
    }

    const selectedTheme = state.selectedTheme;
    console.log(`🎯 Selected theme: "${selectedTheme.title}"`);

    // System prompt for Agent 3 - Using inline prompts to avoid unused variable error

    // Generate initial whitepaper evidence extraction queries
    const initialQueryPrompt = `Based on the selected theme, generate 3-5 targeted queries to EXTRACT MAXIMUM EVIDENCE from the whitepaper for this concept.

**SELECTED THEME**:
Title: ${selectedTheme.title}
Description: ${selectedTheme.description}
Why It Works: ${selectedTheme.whyItWorks.join(", ")}
Detailed Description: ${selectedTheme.detailedDescription}

**MARKETING CONTEXT**:
- Business Context: ${state.businessContext}
- Target Audience: ${state.targetAudience}
- Marketing Goals: ${state.marketingGoals}
- Marketing Brief: ${JSON.stringify(marketingBrief, null, 2)}

**RAG-OPTIMIZED QUERY STRATEGY**:
Generate SHORT, TARGETED keyword queries (2-6 words max) that will effectively retrieve relevant content:

**EXAMPLES OF GOOD RAG QUERIES**:
- "productivity gains statistics"
- "ROI metrics AI"
- "case study results"
- "implementation timeline"
- "adoption barriers"
- "training methodology"

**EXAMPLES OF BAD RAG QUERIES** (too long/verbose):
- "What specific quantitative data does the whitepaper provide about productivity gains"
- "How does the organization measure success in AI implementation"

**QUERY FOCUS AREAS**:
1. **Quantitative data**: "statistics", "ROI data", "productivity metrics", "cost savings"
2. **Case studies**: "case study", "implementation example", "success story"
3. **Methodologies**: "framework", "methodology", "assessment", "training approach"
4. **Barriers**: "resistance", "barriers", "challenges", "obstacles"
5. **Benefits**: "benefits", "advantages", "outcomes", "results"

Keep queries concise and keyword-focused for optimal semantic search results.

${researchQueriesParser.getFormatInstructions()}`;

    // Get initial research queries
    const initialQueriesResponse = await llm.invoke([
      {
        role: "system",
        content:
          "Generate deep research queries to explore the selected theme. Follow the format instructions exactly.",
      },
      { role: "user", content: initialQueryPrompt },
    ]);

    let currentQueries: string[];
    try {
      const content = Array.isArray(initialQueriesResponse.content)
        ? (initialQueriesResponse.content[0] as MessageContentText).text
        : (initialQueriesResponse.content as string);
      currentQueries = await researchQueriesParser.parse(content);
      console.log("✅ Initial research queries generated:", currentQueries);
    } catch (error) {
      console.error("❌ Failed to parse initial queries:", error);
      throw new Error("Failed to generate valid research queries");
    }

    // Execute iterative deep research
    const allResearchResults: SearchResult[] = [];
    const researchLog: Array<{
      query: string;
      resultCount: number;
      analysis: string;
      emergingConcepts: Array<{ angle: string; reasoning: string }>;
      nextQueries: string[];
    }> = [];

    console.log("🔄 Starting deep research process...");

    let totalSearches = 0;
    const MAX_SEARCHES = 12; // Optimized for comprehensive research without truncation

    while (totalSearches < MAX_SEARCHES && currentQueries.length > 0) {
      for (const query of currentQueries) {
        if (totalSearches >= MAX_SEARCHES) break;

        console.log(
          `🔍 Deep research ${totalSearches + 1}/${MAX_SEARCHES}: "${query}"`
        );

        try {
          const searchResult = await pineconeSearchTool.invoke({
            query,
            whitepaperNamespace: whitepaperConfig.namespace,
            indexName: whitepaperConfig.indexName,
            topK: 12,
            topN: 8,
          });

          const parsedResults = JSON.parse(searchResult);
          allResearchResults.push(...parsedResults.results);

          // Analyze results and develop concept angles
          const analysisPrompt = `Analyze these research results and develop concept angles:

**Current Theme**: ${selectedTheme.title}
**Search Query**: "${query}"

**Results**:
${JSON.stringify(parsedResults.results, null, 2)}

**Previous Research**: ${researchLog.map((log) => log.query).join(", ")}

Analyze these results and:
1. Identify interesting angles for content concepts
2. Note compelling evidence or insights
3. Suggest 2-4 SHORT, RAG-OPTIMIZED follow-up queries (2-6 words each) to explore promising angles deeper
4. Consider contrarian or unexpected perspectives

**FOLLOW-UP QUERY EXAMPLES**: "leadership training", "skill assessment", "adoption metrics", "resistance factors"

${conceptDevelopmentParser.getFormatInstructions()}`;

          const analysisResponse = await llm.invoke([
            {
              role: "system",
              content:
                "Analyze research results and develop concept angles. Follow the format instructions exactly.",
            },
            { role: "user", content: analysisPrompt },
          ]);

          let analysis;
          try {
            const content = Array.isArray(analysisResponse.content)
              ? (analysisResponse.content[0] as MessageContentText).text
              : (analysisResponse.content as string);
            analysis = await conceptDevelopmentParser.parse(content);
            console.log(`✅ Analysis completed for query "${query}"`);
          } catch (error) {
            console.error("Failed to parse analysis response:", error);
            analysis = {
              analysis: "Failed to analyze results",
              nextQueries: [],
              emergingConcepts: [],
            };
          }

          researchLog.push({
            query,
            resultCount: parsedResults.results.length,
            analysis: analysis.analysis,
            emergingConcepts: analysis.emergingConcepts,
            nextQueries: analysis.nextQueries,
          });

          // Update queries for next iteration
          currentQueries = analysis.nextQueries;
          totalSearches++;

          // Brief pause between searches
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`❌ Search failed for "${query}":`, error);
          researchLog.push({
            query,
            resultCount: 0,
            analysis: `Search failed: ${error}`,
            emergingConcepts: [],
            nextQueries: [],
          });
          totalSearches++;
        }
      }
    }

    console.log(
      `✅ Deep research complete: ${allResearchResults.length} total results from ${researchLog.length} searches`
    );

    if (allResearchResults.length === 0) {
      throw new Error(
        "No research results found. Please check your Pinecone configuration and whitepaper content."
      );
    }

    // Deduplicate and rank results
    const uniqueResults = Array.from(
      new Map(
        allResearchResults.map((result: SearchResult) => [result.id, result])
      ).values()
    )
      .sort(
        (a: SearchResult, b: SearchResult) => (b.score || 0) - (a.score || 0)
      )
      .slice(0, 40); // Top 40 unique results for comprehensive concept development

    // Generate final research dossier with 3 suggested concepts - SIMPLIFIED VERSION
    const conceptSynthesisPrompt = `Create a streamlined research dossier with 3 suggested content concepts from whitepaper analysis.

**SELECTED THEME**: ${JSON.stringify(selectedTheme, null, 2)}

**MARKETING CONTEXT**:
Business: ${state.businessContext}
Audience: ${state.targetAudience}
Goals: ${state.marketingGoals}

**RESEARCH RESULTS** (${uniqueResults.length} findings):
${uniqueResults
  .slice(0, 20) // Limit to top 20 to reduce prompt size
  .map(
    (result: SearchResult, i) => `${i + 1}. ${result.text.substring(0, 150)}...`
  )
  .join("\n")}

**REQUIREMENTS**:
1. Extract 6-8 KEY FINDINGS with confidence levels (high/medium/low)
2. Create exactly 3 SUGGESTED CONCEPTS for drafting agents to choose from
3. Each concept needs: title, angle, why it works, 3 key evidence points, content direction
4. Include brief research summary

**FORMAT**: Follow the JSON schema exactly. Be concise but specific with evidence.

${researchDossierParser.getFormatInstructions()}`;

    console.log(
      "🎨 Synthesizing research into 3 suggested content concepts..."
    );

    // Generate the final research dossier
    const dossierResponse = await llm.invoke([
      {
        role: "system",
        content:
          "Synthesize comprehensive research into 3 suggested content concepts for drafting agents to evaluate. Follow the format instructions exactly.",
      },
      { role: "user", content: conceptSynthesisPrompt },
    ]);

    console.log("📝 Research dossier received, parsing...");

    // Parse the research dossier
    let researchDossier: ResearchDossier;
    try {
      const content = dossierResponse.content as string;
      console.log("\n🔍 RAW RESEARCH DOSSIER RESPONSE:");
      console.log("=".repeat(80));
      console.log(content);
      console.log("=".repeat(80));

      // Clean up the content to handle potential truncation
      let cleanedContent = content;

      // If content is wrapped in markdown code blocks, extract JSON
      if (content.includes("```json")) {
        const jsonStart = content.indexOf("```json") + 7;
        const jsonEnd = content.indexOf("```", jsonStart);

        if (jsonEnd === -1) {
          // No closing markdown found, likely truncated
          const jsonContent = content.substring(jsonStart);

          // Try to find the last complete object by counting braces
          let braceCount = 0;
          let lastValidIndex = -1;

          for (let i = 0; i < jsonContent.length; i++) {
            if (jsonContent[i] === "{") braceCount++;
            if (jsonContent[i] === "}") {
              braceCount--;
              if (braceCount === 0) {
                lastValidIndex = i;
              }
            }
          }

          if (lastValidIndex > 0) {
            cleanedContent = jsonContent.substring(0, lastValidIndex + 1);
            console.log("🔧 Fixed truncated JSON response");
          } else {
            cleanedContent = jsonContent;
          }
        } else {
          cleanedContent = content.substring(jsonStart, jsonEnd);
        }
      }

      researchDossier = await researchDossierParser.parse(cleanedContent);
      console.log("✅ Research dossier parsed successfully");

      // Add detailed logging for simplified schema
      console.log("\n📊 SIMPLIFIED RESEARCH DOSSIER OUTPUT:");
      console.log("=".repeat(80));

      console.log("\n🎯 SELECTED THEME:");
      console.log("Title:", researchDossier.selectedTheme.title);
      console.log("Description:", researchDossier.selectedTheme.description);
      console.log("Why It Works:", researchDossier.selectedTheme.whyItWorks);
      console.log(
        "Detailed Description:",
        researchDossier.selectedTheme.detailedDescription
      );

      console.log("\n🔬 WHITEPAPER EVIDENCE:");
      console.log(
        "Key Findings Count:",
        researchDossier.whitepaperEvidence.keyFindings.length
      );
      researchDossier.whitepaperEvidence.keyFindings.forEach((finding, i) => {
        console.log(`\nKey Finding ${i + 1}:`);
        console.log("  Claim:", finding.claim);
        console.log("  Evidence:", finding.evidence);
        console.log("  Confidence Level:", finding.confidence);
      });

      console.log("\n🎯 SUGGESTED CONCEPTS (3 TOTAL):");
      researchDossier.suggestedConcepts.forEach((concept, index) => {
        console.log(`\n${"=".repeat(50)}`);
        console.log(`SUGGESTED CONCEPT ${index + 1}: ${concept.title}`);
        console.log(`${"=".repeat(50)}`);
        console.log("🎯 Angle:", concept.angle);
        console.log("💡 Why It Works:", concept.whyItWorks);
        console.log("🔍 Key Evidence:", concept.keyEvidence.join(" | "));
        console.log("📝 Content Direction:", concept.contentDirection);
      });

      console.log("\n📝 RESEARCH SUMMARY:");
      console.log(researchDossier.researchSummary);

      console.log("\n" + "=".repeat(80));
      console.log("🎉 RESEARCH DOSSIER LOGGING COMPLETE");
      console.log("=".repeat(80));
    } catch (parseError) {
      console.error("❌ Failed to parse research dossier:", parseError);
      console.log("\n🔍 RAW CONTENT THAT FAILED TO PARSE:");
      console.log("=".repeat(80));
      console.log(dossierResponse.content);
      console.log("=".repeat(80));
      throw new Error("Failed to generate valid research dossier");
    }

    console.log(
      "✅ Agent 3: Generated research dossier with 3 suggested content concepts successfully"
    );

    return {
      researchDossier,
      searchHistory: [
        ...(state.searchHistory || []),
        ...researchLog.map((log) => log.query),
      ],
      currentStep: "research_complete",
      needsHumanInput: true, // Pause for user to review concepts
    };
  } catch (error) {
    console.error("❌ Agent 3 Error:", error);
    throw new Error(
      `Deep research failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
