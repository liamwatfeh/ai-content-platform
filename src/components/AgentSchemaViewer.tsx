"use client";

import { useEffect, useState } from "react";
import { DocumentTextIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

interface SchemaField {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  example?: string;
}

interface AgentSchema {
  id: string;
  name: string;
  inputSchema: SchemaField[];
  outputSchema: SchemaField[];
}

interface AgentSchemaViewerProps {
  agentId: string;
}

export default function AgentSchemaViewer({ agentId }: AgentSchemaViewerProps) {
  const [schemaData, setSchemaData] = useState<AgentSchema | null>(null);

  useEffect(() => {
    // Get schema data based on agent ID
    const getSchemaData = (id: string): AgentSchema | null => {
      const schemaMap: Record<string, AgentSchema> = {
        agent1: {
          id: "agent1",
          name: "Agent 1: Brief Creator",
          inputSchema: [
            {
              name: "businessContext",
              type: "string",
              description: "Business context and background",
              required: true,
              example: "SaaS company launching new product",
            },
            {
              name: "targetAudience",
              type: "string",
              description: "Target audience description",
              required: true,
              example: "B2B decision makers",
            },
            {
              name: "marketingGoals",
              type: "string",
              description: "Marketing objectives",
              required: true,
              example: "Generate leads and awareness",
            },
            {
              name: "articlesCount",
              type: "number",
              description: "Number of articles to generate",
              required: true,
              example: "2",
            },
            {
              name: "linkedinPostsCount",
              type: "number",
              description: "Number of LinkedIn posts",
              required: true,
              example: "3",
            },
            {
              name: "socialPostsCount",
              type: "number",
              description: "Number of social posts",
              required: true,
              example: "5",
            },
            {
              name: "ctaType",
              type: "string",
              description: "Call-to-action type",
              required: true,
              example: "sign_up",
            },
            {
              name: "ctaUrl",
              type: "string",
              description: "Call-to-action URL",
              required: false,
              example: "https://example.com/signup",
            },
          ],
          outputSchema: [
            {
              name: "executiveSummary",
              type: "string",
              description: "Campaign executive summary",
            },
            {
              name: "targetPersona",
              type: "object",
              description: "Detailed target persona analysis",
            },
            {
              name: "campaignObjectives",
              type: "array",
              description: "List of campaign objectives",
            },
            {
              name: "keyMessages",
              type: "array",
              description: "Key marketing messages",
            },
            {
              name: "contentStrategy",
              type: "object",
              description: "Content strategy breakdown",
            },
            {
              name: "callToAction",
              type: "object",
              description: "Call-to-action configuration",
            },
          ],
        },
        agent2: {
          id: "agent2",
          name: "Agent 2: Theme Generator",
          inputSchema: [
            {
              name: "marketingBrief",
              type: "string",
              description: "JSON marketing brief from Agent 1",
              required: true,
            },
            {
              name: "selectedWhitepaperId",
              type: "string",
              description: "ID of selected whitepaper",
              required: true,
            },
          ],
          outputSchema: [
            {
              name: "contentThemes",
              type: "array",
              description: "Array of generated content themes",
            },
            {
              name: "themeAnalysis",
              type: "object",
              description: "Analysis of theme effectiveness",
            },
            {
              name: "recommendedAngles",
              type: "array",
              description: "Recommended content angles",
            },
          ],
        },
        agent3: {
          id: "agent3",
          name: "Agent 3: Researcher",
          inputSchema: [
            {
              name: "selectedTheme",
              type: "object",
              description: "Selected theme from Agent 2",
              required: true,
            },
            {
              name: "marketingBrief",
              type: "string",
              description: "Marketing brief from Agent 1",
              required: true,
            },
            {
              name: "selectedWhitepaperId",
              type: "string",
              description: "Whitepaper ID for research",
              required: true,
            },
          ],
          outputSchema: [
            {
              name: "researchDossier",
              type: "object",
              description: "Comprehensive research findings",
            },
            {
              name: "whitepaperEvidence",
              type: "object",
              description: "Evidence from whitepaper analysis",
            },
            {
              name: "suggestedConcepts",
              type: "array",
              description: "Content concepts based on research",
            },
          ],
        },
        agent4a: {
          id: "agent4a",
          name: "Agent 4a: Article Writer",
          inputSchema: [
            {
              name: "marketingBrief",
              type: "string",
              description: "Marketing brief from Agent 1",
              required: true,
            },
            {
              name: "researchDossier",
              type: "object",
              description: "Research dossier from Agent 3",
              required: true,
            },
            {
              name: "selectedTheme",
              type: "object",
              description: "Selected theme from Agent 2",
              required: true,
            },
            {
              name: "articlesCount",
              type: "number",
              description: "Number of articles to generate",
              required: true,
            },
          ],
          outputSchema: [
            {
              name: "articles",
              type: "array",
              description: "Generated articles in The Economist style",
            },
            {
              name: "metadata",
              type: "object",
              description: "Article metadata and analytics",
            },
            {
              name: "researchSources",
              type: "array",
              description: "Sources used in article generation",
            },
          ],
        },
        agent4b: {
          id: "agent4b",
          name: "Agent 4b: LinkedIn Writer",
          inputSchema: [
            {
              name: "marketingBrief",
              type: "string",
              description: "Marketing brief from Agent 1",
              required: true,
            },
            {
              name: "researchDossier",
              type: "object",
              description: "Research dossier from Agent 3",
              required: true,
            },
            {
              name: "selectedTheme",
              type: "object",
              description: "Selected theme from Agent 2",
              required: true,
            },
            {
              name: "linkedinPostsCount",
              type: "number",
              description: "Number of LinkedIn posts to generate",
              required: true,
            },
          ],
          outputSchema: [
            {
              name: "linkedinPosts",
              type: "array",
              description: "B2B LinkedIn posts optimized for engagement",
            },
            {
              name: "engagementStrategy",
              type: "object",
              description: "LinkedIn engagement strategy",
            },
            {
              name: "hashtagRecommendations",
              type: "array",
              description: "Recommended hashtags for reach",
            },
          ],
        },
        agent4c: {
          id: "agent4c",
          name: "Agent 4c: Social Writer",
          inputSchema: [
            {
              name: "marketingBrief",
              type: "string",
              description: "Marketing brief from Agent 1",
              required: true,
            },
            {
              name: "researchDossier",
              type: "object",
              description: "Research dossier from Agent 3",
              required: true,
            },
            {
              name: "selectedTheme",
              type: "object",
              description: "Selected theme from Agent 2",
              required: true,
            },
            {
              name: "socialPostsCount",
              type: "number",
              description: "Number of social posts to generate",
              required: true,
            },
          ],
          outputSchema: [
            {
              name: "socialPosts",
              type: "array",
              description: "Twitter posts optimized for viral engagement",
            },
            {
              name: "viralStrategy",
              type: "object",
              description: "Strategy for maximizing shareability",
            },
            {
              name: "engagementHooks",
              type: "array",
              description: "Hooks designed to drive engagement",
            },
          ],
        },
        agent5a: {
          id: "agent5a",
          name: "Agent 5a: Article Editor",
          inputSchema: [
            {
              name: "articles",
              type: "array",
              description: "Article drafts from Agent 4a",
              required: true,
            },
            {
              name: "marketingBrief",
              type: "string",
              description: "Original marketing brief",
              required: true,
            },
          ],
          outputSchema: [
            {
              name: "editedArticles",
              type: "array",
              description: "Polished articles following The Economist style",
            },
            {
              name: "editingSummary",
              type: "object",
              description: "Summary of changes made",
            },
            {
              name: "qualityScore",
              type: "number",
              description: "Content quality assessment",
            },
          ],
        },
        agent5b: {
          id: "agent5b",
          name: "Agent 5b: LinkedIn Editor",
          inputSchema: [
            {
              name: "linkedinPosts",
              type: "array",
              description: "LinkedIn drafts from Agent 4b",
              required: true,
            },
            {
              name: "marketingBrief",
              type: "string",
              description: "Original marketing brief",
              required: true,
            },
          ],
          outputSchema: [
            {
              name: "editedLinkedinPosts",
              type: "array",
              description: "Enhanced LinkedIn posts for B2B engagement",
            },
            {
              name: "engagementOptimizations",
              type: "object",
              description: "Applied engagement optimizations",
            },
            {
              name: "professionalToneScore",
              type: "number",
              description: "Professional tone assessment",
            },
          ],
        },
        agent5c: {
          id: "agent5c",
          name: "Agent 5c: Social Editor",
          inputSchema: [
            {
              name: "socialPosts",
              type: "array",
              description: "Social drafts from Agent 4c",
              required: true,
            },
            {
              name: "marketingBrief",
              type: "string",
              description: "Original marketing brief",
              required: true,
            },
          ],
          outputSchema: [
            {
              name: "editedSocialPosts",
              type: "array",
              description: "Optimized social posts for viral potential",
            },
            {
              name: "viralOptimizations",
              type: "object",
              description: "Applied viral optimizations",
            },
            {
              name: "engagementScore",
              type: "number",
              description: "Predicted engagement score",
            },
          ],
        },
      };

      return schemaMap[id] || null;
    };

    setSchemaData(getSchemaData(agentId));
  }, [agentId]);

  if (!schemaData) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          Schema not found for agent: {agentId}
        </div>
      </div>
    );
  }

  // Convert schema fields to JSON format
  const formatSchemaAsJson = (fields: SchemaField[]) => {
    const jsonSchema: Record<string, any> = {};

    fields.forEach((field) => {
      jsonSchema[field.name] = {
        type: field.type,
        description: field.description,
        ...(field.required !== undefined && { required: field.required }),
        ...(field.example && { example: field.example }),
      };
    });

    return JSON.stringify(jsonSchema, null, 2);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Input/Output Schema
        </h3>
        <p className="text-sm text-gray-600">
          Data structures and formats for {schemaData.name}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Schema */}
        <div>
          <div className="flex items-center mb-4">
            <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-base font-medium text-gray-900">
              Input Schema
            </h3>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border">
            <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap font-mono">
              {formatSchemaAsJson(schemaData.inputSchema)}
            </pre>
          </div>
        </div>

        {/* Output Schema */}
        <div>
          <div className="flex items-center mb-4">
            <ArrowRightIcon className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="text-base font-medium text-gray-900">
              Output Schema
            </h3>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border">
            <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap font-mono">
              {formatSchemaAsJson(schemaData.outputSchema)}
            </pre>
          </div>
        </div>
      </div>

      {/* Data Flow Info */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Data Flow</h4>
        <p className="text-sm text-blue-700">
          This agent receives structured inputs from previous workflow steps,
          processes them using its configured system prompt and model, then
          outputs structured data for use by subsequent agents. All schemas are
          validated to ensure data integrity throughout the workflow.
        </p>
      </div>
    </div>
  );
}
