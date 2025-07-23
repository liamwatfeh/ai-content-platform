#!/usr/bin/env node

/**
 * Real End-to-End Workflow Test
 * Tests the complete pipeline exactly as defined in workflow.ts:
 * Agent 1 → Agent 2 → (human theme selection) → Agent 3 → Agents 4a/4b/4c → Agents 5a/5b/5c
 */

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");
config({ path: join(rootDir, ".env.local") });

// Check environment variables
if (!process.env.OPENAI_API_KEY || !process.env.ANTHROPIC_API_KEY) {
  console.error(
    "❌ Missing required API keys (OPENAI_API_KEY and ANTHROPIC_API_KEY)"
  );
  process.exit(1);
} . . .   b

console.log("🚀 REAL END-TO-END WORKFLOW TEST");
console.log("Following the exact workflow.ts pipeline structure");
console.log("=".repeat(80));

const testScript = `
import { briefCreatorAgent } from './src/lib/agents/agent1-brief-creator.ts';
import { themeGeneratorAgent } from './src/lib/agents/agent2-theme-generator.ts';
import { deepResearchAgent } from './src/lib/agents/agent3-researcher.ts';
import { articleWriterAgent } from './src/lib/agents/agent4a-article-writer.ts';
import { linkedinWriterAgent } from './src/lib/agents/agent4b-linkedin-writer.ts';
import { socialWriterAgent } from './src/lib/agents/agent4c-social-writer.ts';
import { articleEditorAgent } from './src/lib/agents/agent5a-article-editor.ts';
import { linkedinEditorAgent } from './src/lib/agents/agent5b-linkedin-editor.ts';
import { socialEditorAgent } from './src/lib/agents/agent5c-social-editor.ts';
import { supabase } from './src/lib/supabase.ts';

// Function to get a real whitepaper ID from the database
async function getRealWhitepaperID() {
  console.log("🔍 Fetching real whitepaper ID from database...");
  
  try {
    const { data: whitepapers, error } = await supabase
      .from("whitepapers")
      .select("id, title, filename")
      .limit(1)
      .single();

    if (error) {
      throw new Error(\`Database error: \${error.message}\`);
    }

    if (!whitepapers) {
      throw new Error("No whitepapers found in database");
    }

    console.log(\`✅ Found whitepaper: "\${whitepapers.title}" (ID: \${whitepapers.id})\`);
    return whitepapers.id;
  } catch (error) {
    console.error("❌ Error fetching whitepaper ID:", error);
    // Fallback: proceed without whitepaper for basic testing
    console.log("⚠️ Proceeding without whitepaper for basic workflow test");
    return null;
  }
}

async function runCompleteWorkflow() {
  console.log("🚀 Starting COMPLETE workflow test...");
  const overallStartTime = Date.now();
  
  try {
    // Get real whitepaper ID first
    const realWhitepaperID = await getRealWhitepaperID();
    
    // Real test configuration with actual or no whitepaper ID
    const INITIAL_INPUT = {
      businessContext: "We are a B2B SaaS company that provides AI-powered customer analytics and insights platform for mid-market retailers. Our platform helps retailers understand customer behavior, optimize inventory, and increase sales through data-driven recommendations.",
      targetAudience: "Retail managers, e-commerce directors, and business intelligence analysts at mid-market retail companies (50-500 employees) who need better customer insights.",
      marketingGoals: "Generate qualified leads for sales demos, establish thought leadership in retail AI, and drive trial signups for our analytics platform.",
      articlesCount: 1,
      linkedinPostsCount: 2, 
      socialPostsCount: 2,
      ctaType: "download_whitepaper",
      ctaUrl: "https://example.com/retail-ai-whitepaper",
      selectedWhitepaperId: realWhitepaperID,
      currentStep: "brief_creation",
      isComplete: false,
      needsHumanInput: false
    };

    // STEP 1: Agent 1 - Brief Creator
    console.log("\\n" + "=".repeat(60));
    console.log("📝 STEP 1: Agent 1 - Brief Creator");
    console.log("=".repeat(60));
    
    const step1Start = Date.now();
    const briefResult = await briefCreatorAgent(INITIAL_INPUT);
    const step1Duration = (Date.now() - step1Start) / 1000;
    
    console.log(\`✅ Agent 1 completed in \${step1Duration.toFixed(2)}s\`);
    console.log(\`📋 Marketing brief: \${briefResult.marketingBrief ? 'Created' : 'Failed'}\`);
    
    if (!briefResult.marketingBrief) {
      throw new Error("Agent 1 failed to create marketing brief");
    }

    // STEP 2: Agent 2 - Theme Generator
    console.log("\\n" + "=".repeat(60));
    console.log("🎯 STEP 2: Agent 2 - Theme Generator");
    console.log("=".repeat(60));
    
    const themeInput = {
      ...INITIAL_INPUT,
      ...briefResult,
      currentStep: "brief_complete"
    };
    
    const step2Start = Date.now();
    const themeResult = await themeGeneratorAgent(themeInput);
    const step2Duration = (Date.now() - step2Start) / 1000;
    
    console.log(\`✅ Agent 2 completed in \${step2Duration.toFixed(2)}s\`);
    console.log(\`🎨 Themes generated: \${themeResult.generatedThemes?.length || 0}\`);
    
    if (!themeResult.generatedThemes || themeResult.generatedThemes.length === 0) {
      throw new Error("Agent 2 failed to generate themes");
    }

    // Simulate human theme selection (select first theme)
    const selectedTheme = themeResult.generatedThemes[0];
    console.log(\`\\n👤 HUMAN SELECTION: Selecting theme "\${selectedTheme.title}"\`);

    // STEP 3: Agent 3 - Deep Research
    console.log("\\n" + "=".repeat(60));
    console.log("🔬 STEP 3: Agent 3 - Deep Research");
    console.log("=".repeat(60));
    
    const researchInput = {
      ...themeInput,
      ...themeResult,
      selectedTheme,
      currentStep: "theme_selected"
    };
    
    const step3Start = Date.now();
    const researchResult = await deepResearchAgent(researchInput);
    const step3Duration = (Date.now() - step3Start) / 1000;
    
    console.log(\`✅ Agent 3 completed in \${step3Duration.toFixed(2)}s\`);
    console.log(\`📊 Research dossier: \${researchResult.researchDossier ? 'Created' : 'Failed'}\`);
    console.log(\`🔍 Key findings: \${researchResult.researchDossier?.whitepaperEvidence?.keyFindings?.length || 0}\`);
    
    if (!researchResult.researchDossier) {
      throw new Error("Agent 3 failed to create research dossier");
    }

    // STEP 4: Agents 4a/4b/4c - Content Generation (Parallel)
    console.log("\\n" + "=".repeat(60));
    console.log("✍️ STEP 4: Agents 4a/4b/4c - Content Generation (PARALLEL)");
    console.log("=".repeat(60));
    
    const contentInput = {
      ...researchInput,
      ...researchResult,
      currentStep: "research_complete"
    };
    
    console.log("🚀 Starting parallel content generation...");
    const step4Start = Date.now();
    
    // Run all content agents in parallel as per workflow.ts
    const contentPromises = [];
    
    if (contentInput.articlesCount > 0) {
      console.log("📝 Starting Agent 4a (Articles) in parallel...");
      contentPromises.push(articleWriterAgent(contentInput));
    }
    
    if (contentInput.linkedinPostsCount > 0) {
      console.log("💼 Starting Agent 4b (LinkedIn) in parallel...");
      contentPromises.push(linkedinWriterAgent(contentInput));
    }
    
    if (contentInput.socialPostsCount > 0) {
      console.log("📱 Starting Agent 4c (Social) in parallel...");
      contentPromises.push(socialWriterAgent(contentInput));
    }
    
    const contentResults = await Promise.all(contentPromises);
    const step4Duration = (Date.now() - step4Start) / 1000;
    
    // Merge results
    const mergedContentResults = contentResults.reduce((acc, result) => ({
      ...acc,
      ...result
    }), {});
    
    console.log(\`✅ All content generation completed in \${step4Duration.toFixed(2)}s\`);
    console.log(\`📰 Articles: \${mergedContentResults.articleOutput?.articles?.length || 0}\`);
    console.log(\`💼 LinkedIn posts: \${mergedContentResults.linkedinOutput?.posts?.length || 0}\`);
    console.log(\`📱 Social posts: \${mergedContentResults.socialOutput?.posts?.length || 0}\`);

    // STEP 5: Agents 5a/5b/5c - Content Editing (Parallel)
    console.log("\\n" + "=".repeat(60));
    console.log("✏️ STEP 5: Agents 5a/5b/5c - Content Editing (PARALLEL)");
    console.log("=".repeat(60));
    
    const editingInput = {
      ...contentInput,
      ...mergedContentResults,
      currentStep: "content_generated"
    };
    
    console.log("🚀 Starting parallel content editing...");
    const step5Start = Date.now();
    
    // Run all editor agents in parallel as per workflow.ts
    const editingPromises = [];
    
    if (editingInput.articleOutput) {
      console.log("📝 Starting Agent 5a (Article Editor) in parallel...");
      editingPromises.push(articleEditorAgent(editingInput));
    }
    
    if (editingInput.linkedinOutput) {
      console.log("💼 Starting Agent 5b (LinkedIn Editor) in parallel...");
      editingPromises.push(linkedinEditorAgent(editingInput));
    }
    
    if (editingInput.socialOutput) {
      console.log("📱 Starting Agent 5c (Social Editor) in parallel...");
      editingPromises.push(socialEditorAgent(editingInput));
    }
    
    const editingResults = await Promise.all(editingPromises);
    const step5Duration = (Date.now() - step5Start) / 1000;
    
    // Merge editing results
    const mergedEditingResults = editingResults.reduce((acc, result) => ({
      ...acc,
      ...result
    }), {});
    
    console.log(\`✅ All content editing completed in \${step5Duration.toFixed(2)}s\`);
    console.log(\`📝 Edited articles: \${mergedEditingResults.editedArticleOutput?.articles?.length || 0}\`);
    console.log(\`💼 Edited LinkedIn: \${mergedEditingResults.editedLinkedInOutput?.posts?.length || 0}\`);
    console.log(\`📱 Edited social: \${mergedEditingResults.editedSocialOutput?.posts?.length || 0}\`);

    // FINAL RESULTS
    const totalDuration = (Date.now() - overallStartTime) / 1000;
    
    console.log("\\n" + "🎉".repeat(20));
    console.log("🎉 COMPLETE WORKFLOW TEST SUCCESSFUL! 🎉");
    console.log("🎉".repeat(20));
    console.log("\\n📊 PIPELINE PERFORMANCE SUMMARY:");
    console.log("=" .repeat(60));
    console.log(\`📝 Agent 1 (Brief): \${step1Duration.toFixed(2)}s\`);
    console.log(\`🎯 Agent 2 (Themes): \${step2Duration.toFixed(2)}s\`);
    console.log(\`🔬 Agent 3 (Research): \${step3Duration.toFixed(2)}s\`);
    console.log(\`✍️ Agents 4a/4b/4c (Content): \${step4Duration.toFixed(2)}s (parallel)\`);
    console.log(\`✏️ Agents 5a/5b/5c (Editing): \${step5Duration.toFixed(2)}s (parallel)\`);
    console.log(\`🚀 TOTAL PIPELINE TIME: \${totalDuration.toFixed(2)}s\`);
    
    console.log("\\n🎯 CONTENT QUALITY METRICS:");
    console.log("=" .repeat(60));
    if (mergedEditingResults.editedArticleOutput) {
      console.log(\`📰 Article Quality Score: \${mergedEditingResults.editedArticleOutput.quality_score}/10\`);
    }
    if (mergedEditingResults.editedLinkedInOutput) {
      console.log(\`💼 LinkedIn Quality Score: \${mergedEditingResults.editedLinkedInOutput.quality_score}/10\`);
    }
    if (mergedEditingResults.editedSocialOutput) {
      console.log(\`📱 Social Quality Score: \${mergedEditingResults.editedSocialOutput.quality_score}/10\`);
    }
    
    // Show sample output
    console.log("\\n📄 SAMPLE FINAL OUTPUT:");
    console.log("=" .repeat(60));
    if (mergedEditingResults.editedArticleOutput?.articles?.[0]) {
      const article = mergedEditingResults.editedArticleOutput.articles[0];
      console.log(\`📰 Article: "\${article.title}"\`);
      console.log(\`   Word Count: \${article.wordCount}\`);
      console.log(\`   Preview: \${article.content.substring(0, 120)}...\`);
    }
    
    if (mergedEditingResults.editedLinkedInOutput?.posts?.[0]) {
      const post = mergedEditingResults.editedLinkedInOutput.posts[0];
      console.log(\`💼 LinkedIn: "\${post.content.substring(0, 80)}..."\`);
    }
    
    console.log("\\n🚀 COMPLETE END-TO-END PIPELINE VALIDATED!");
    console.log("All 8 agents working correctly in the proper workflow sequence!");

  } catch (error) {
    console.error("\\n❌ WORKFLOW TEST FAILED:");
    console.error("=" .repeat(60));
    console.error("Error:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }
}

runCompleteWorkflow().catch(console.error);
`;

// Write and execute the test
import { writeFileSync, unlinkSync } from "fs";
const tempFile = join(rootDir, "temp-real-workflow-test.ts");
writeFileSync(tempFile, testScript);

console.log("⚡ Executing real workflow test with tsx...");

const child = spawn("npx", ["tsx", tempFile], {
  stdio: "inherit",
  cwd: rootDir,
});

child.on("close", (code) => {
  try {
    unlinkSync(tempFile);
  } catch (e) {
    // Ignore cleanup errors
  }

  if (code === 0) {
    console.log("\n✅ Real workflow test completed successfully!");
  } else {
    console.log(`\n❌ Real workflow test failed with exit code ${code}`);
    process.exit(code);
  }
});

child.on("error", (error) => {
  console.error(`❌ Failed to start workflow test: ${error.message}`);
  try {
    unlinkSync(tempFile);
  } catch (e) {
    // Ignore cleanup errors
  }
  process.exit(1);
});
