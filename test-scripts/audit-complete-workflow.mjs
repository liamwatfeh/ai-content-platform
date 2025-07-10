#!/usr/bin/env node

// Comprehensive Workflow Audit Script
// Tests the complete pipeline: Agent 1 → Agent 2 → HITL → Agent 3 → Agents 4a/4b/4c → Agents 5a/5b/5c

import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

// Set up the module path
process.env.NODE_PATH = `${projectRoot}/node_modules:${process.env.NODE_PATH || ""}`;

// Dynamic imports for ES modules
const { executeContentGeneration, continueWithSelectedTheme } = await import(
  `${projectRoot}/src/lib/workflow.ts`
);

// Test configuration
const TEST_CONFIG = {
  businessContext: `**Brilliant Noise Audit Test**
  
Brilliant Noise is a Brighton-based strategic marketing partner that fuses management-consultancy rigour with creative-agency craft. For 14+ years we've helped global and challenger brands translate emerging digital and generative-AI capabilities into measurable growth through AI-literacy programmes, our proprietary AI-B-C™ Accelerator, data-driven content strategy, and experience design—eliminating budget waste and unlocking high performance.`,

  targetAudience: `**Test Persona – "Global Brand Marketing Director on an AI Mission"**
• Profile: 40-55-year-old senior marketer overseeing a £15–30m annual budget
• Objectives: Upskill marketing team in generative-AI workflows within six months
• Pain points: Legacy processes, siloed data, pressure to prove AI ROI quickly
• Decision drivers: Case studies, clear implementation roadmap, strategic partner`,

  marketingGoals: `**Test Marketing Goals**
Over the next 90 days, book 15 qualified discovery calls with Marketing Directors at fast-growing UK & EU consumer scale-ups by:
1. Publishing one 1,500-word thought-leadership article
2. Promoting via three LinkedIn posts (organic + Sponsored Content)
3. Running account-based email sequence to 300 senior marketers
Success metrics: 15 discovery-call bookings, ≥18% landing-page conversion rate, £250k qualified pipeline`,

  articlesCount: 1,
  linkedinPostsCount: 2,
  socialPostsCount: 3,
  ctaType: "download_whitepaper",
  ctaUrl: "brilliantnoise.com",
  selectedWhitepaperId: "1f1f161a-92c5-4481-81b1-4bef0ac31651",
};

async function auditCompleteWorkflow() {
  console.log("🔍 COMPREHENSIVE WORKFLOW AUDIT");
  console.log("=".repeat(60));
  console.log(
    "Testing: Agent 1 → Agent 2 → HITL → Agent 3 → Agents 4abc → Agents 5abc"
  );
  console.log("=".repeat(60));

  const startTime = Date.now();

  try {
    // PHASE 1: Test initial workflow (Agent 1 + Agent 2)
    console.log("\n📋 PHASE 1: Initial Workflow (Agent 1 + Agent 2)");
    console.log("-".repeat(50));

    const initialInput = {
      ...TEST_CONFIG,
      currentStep: "brief_creation",
      isComplete: false,
      needsHumanInput: false,
      previousThemes: [],
      searchHistory: [],
      regenerationCount: 0,
    };

    // Call the generate-themes API endpoint to simulate frontend flow
    console.log("🚀 Calling theme generation API...");
    const themeResponse = await fetch(
      "http://localhost:3000/api/generate-themes",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialInput),
      }
    );

    if (!themeResponse.ok) {
      throw new Error(`Theme generation failed: ${themeResponse.status}`);
    }

    const themeData = await themeResponse.json();
    console.log("✅ Theme generation completed");
    console.log(
      `📊 Themes generated: ${themeData.generated_themes?.length || 0}`
    );
    console.log(`🎯 Current step: ${themeData.workflow_state?.currentStep}`);
    console.log(
      `⏸️ Needs human input: ${themeData.workflow_state?.needsHumanInput}`
    );

    // Validate Agent 1 + Agent 2 results
    if (
      !themeData.success ||
      !themeData.generated_themes ||
      themeData.generated_themes.length !== 3
    ) {
      throw new Error(
        "Phase 1 failed: Expected 3 themes from Agent 1 + Agent 2"
      );
    }

    // PHASE 2: Test theme selection and continuation (Agent 3 + Agents 4abc + Agents 5abc)
    console.log("\n🎯 PHASE 2: Theme Selection + Complete Pipeline");
    console.log("-".repeat(50));

    // Select the first theme
    const selectedTheme = themeData.generated_themes[0];
    console.log(`👤 Simulating theme selection: "${selectedTheme.title}"`);

    // Prepare complete workflow payload (simulating frontend)
    const completeWorkflowPayload = {
      ...TEST_CONFIG,
      marketingBrief: themeData.marketing_brief,
      generatedThemes: themeData.generated_themes,
      selectedTheme: selectedTheme,
      currentStep: "theme_selected",
      needsHumanInput: false,
      isComplete: false,
    };

    // Call the complete workflow API
    console.log("🚀 Calling complete workflow API...");
    const contentResponse = await fetch(
      "http://localhost:3000/api/generate-content",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completeWorkflowPayload),
      }
    );

    if (!contentResponse.ok) {
      throw new Error(`Complete workflow failed: ${contentResponse.status}`);
    }

    const contentData = await contentResponse.json();
    console.log("✅ Complete workflow completed");

    // PHASE 3: Validate final results
    console.log("\n📊 PHASE 3: Results Validation");
    console.log("-".repeat(50));

    const finalResults = contentData.data;

    // Check all required outputs
    const validations = [
      {
        name: "Marketing Brief",
        value: finalResults.marketing_brief,
        required: true,
      },
      {
        name: "Selected Theme",
        value: finalResults.selected_theme,
        required: true,
      },
      {
        name: "Research Dossier",
        value: finalResults.research_dossier,
        required: true,
      },
      {
        name: "Article Content",
        value: finalResults.article,
        required: TEST_CONFIG.articlesCount > 0,
      },
      {
        name: "LinkedIn Posts",
        value: finalResults.linkedin_posts,
        required: TEST_CONFIG.linkedinPostsCount > 0,
      },
      {
        name: "Social Posts",
        value: finalResults.social_posts,
        required: TEST_CONFIG.socialPostsCount > 0,
      },
      {
        name: "Edited Article",
        value: finalResults.edited_content?.article,
        required: TEST_CONFIG.articlesCount > 0,
      },
      {
        name: "Edited LinkedIn",
        value: finalResults.edited_content?.linkedin_posts,
        required: TEST_CONFIG.linkedinPostsCount > 0,
      },
      {
        name: "Edited Social",
        value: finalResults.edited_content?.social_posts,
        required: TEST_CONFIG.socialPostsCount > 0,
      },
    ];

    let allPassed = true;
    for (const validation of validations) {
      const status =
        validation.required && !validation.value ? "❌ FAIL" : "✅ PASS";
      console.log(
        `${status} ${validation.name}: ${validation.value ? "Present" : "Missing"}`
      );

      if (validation.required && !validation.value) {
        allPassed = false;
      }
    }

    // Check agents used
    const agentsUsed = finalResults.generation_metadata?.agents_used || [];
    console.log(`\n🤖 Agents Used: ${agentsUsed.join(", ")}`);

    // Expected agents based on configuration
    const expectedAgents = [
      "brief-creator",
      "theme-generator",
      "deep-researcher",
      ...(TEST_CONFIG.articlesCount > 0
        ? ["article-writer", "article-editor"]
        : []),
      ...(TEST_CONFIG.linkedinPostsCount > 0
        ? ["linkedin-writer", "linkedin-editor"]
        : []),
      ...(TEST_CONFIG.socialPostsCount > 0
        ? ["social-writer", "social-editor"]
        : []),
    ];

    const agentValidation = expectedAgents.every((agent) =>
      agentsUsed.includes(agent)
    );
    console.log(
      `🔍 All Expected Agents Ran: ${agentValidation ? "✅ YES" : "❌ NO"}`
    );

    if (!agentValidation) {
      console.log(`Expected: ${expectedAgents.join(", ")}`);
      console.log(`Actual: ${agentsUsed.join(", ")}`);
      allPassed = false;
    }

    // Check quality scores
    const qualityScores =
      finalResults.generation_metadata?.content_quality_scores;
    if (qualityScores) {
      console.log("\n📈 Quality Scores:");
      if (qualityScores.article)
        console.log(`   Article: ${qualityScores.article}/10`);
      if (qualityScores.linkedin)
        console.log(`   LinkedIn: ${qualityScores.linkedin}/10`);
      if (qualityScores.social)
        console.log(`   Social: ${qualityScores.social}/10`);
    }

    // Final summary
    const totalTime = (Date.now() - startTime) / 1000;
    console.log("\n" + "=".repeat(60));
    console.log("🏁 AUDIT SUMMARY");
    console.log("=".repeat(60));
    console.log(`⏱️ Total Execution Time: ${totalTime.toFixed(2)}s`);
    console.log(
      `📊 Processing Time: ${finalResults.generation_metadata?.processing_time_ms || 0}ms`
    );
    console.log(
      `🔍 Whitepaper Chunks Analyzed: ${finalResults.generation_metadata?.whitepaper_chunks_analyzed || 0}`
    );
    console.log(
      `✏️ Editing Completed: ${finalResults.generation_metadata?.editing_completed ? "YES" : "NO"}`
    );
    console.log(
      `🎯 Overall Result: ${allPassed ? "✅ PASS - Workflow functioning correctly" : "❌ FAIL - Issues detected"}`
    );

    if (!allPassed) {
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ AUDIT FAILED");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

// Run the audit
auditCompleteWorkflow();
