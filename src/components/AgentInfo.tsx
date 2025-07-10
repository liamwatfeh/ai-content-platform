"use client";

import { useEffect, useState } from "react";
import {
  CpuChipIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface AgentData {
  id: string;
  name: string;
  description: string;
  model: string;
  status: string;
  purpose: string;
  stepNumber: number;
  dependencies: string[];
  outputs: string[];
}

interface AgentInfoProps {
  agentId: string;
}

export default function AgentInfo({ agentId }: AgentInfoProps) {
  const [agentData, setAgentData] = useState<AgentData | null>(null);

  useEffect(() => {
    // Get agent data based on ID
    const getAgentData = (id: string): AgentData | null => {
      const agentMap: Record<string, AgentData> = {
        agent1: {
          id: "agent1",
          name: "Agent 1: Brief Creator",
          description:
            "Analyzes business requirements and generates comprehensive marketing briefs with target personas, objectives, and key messages.",
          model: "o3-2025-04-16",
          status: "active",
          purpose:
            "Generate a detailed marketing brief optimized for LLM consumption",
          stepNumber: 1,
          dependencies: ["User Input"],
          outputs: ["Marketing Brief", "Target Persona", "Campaign Objectives"],
        },
        agent2: {
          id: "agent2",
          name: "Agent 2: Theme Generator",
          description:
            "Identifies optimal content themes and angles based on marketing brief and whitepaper analysis.",
          model: "Claude Sonnet 4",
          status: "active",
          purpose:
            "Generate content themes from marketing brief and whitepaper analysis",
          stepNumber: 2,
          dependencies: ["Agent 1: Marketing Brief", "Selected Whitepaper"],
          outputs: ["Content Themes", "Theme Analysis", "Recommended Angles"],
        },
        agent3: {
          id: "agent3",
          name: "Agent 3: Researcher",
          description:
            "Conducts deep research using Pinecone search to gather evidence and create comprehensive research dossiers.",
          model: "Claude Sonnet 4",
          status: "active",
          purpose:
            "Conduct research and create comprehensive research dossiers",
          stepNumber: 3,
          dependencies: ["Agent 2: Selected Theme", "Pinecone Vector Database"],
          outputs: ["Research Dossier", "Key Findings", "Evidence Sources"],
        },
        agent4a: {
          id: "agent4a",
          name: "Agent 4a: Article Writer",
          description:
            "Generates The Economist-style articles with guaranteed structured output and optional research capabilities.",
          model: "Claude Sonnet 4",
          status: "active",
          purpose:
            "Draft 1-3 articles using Economist style guide and research",
          stepNumber: 4,
          dependencies: [
            "Agent 3: Research Dossier",
            "Marketing Brief",
            "Selected Theme",
          ],
          outputs: [
            "Article Content",
            "The Economist Style",
            "Structured JSON",
          ],
        },
        agent4b: {
          id: "agent4b",
          name: "Agent 4b: LinkedIn Writer",
          description:
            "Creates B2B thought leadership LinkedIn posts optimized for professional engagement and networking.",
          model: "Claude Sonnet 4",
          status: "active",
          purpose: "Create B2B thought leadership LinkedIn posts",
          stepNumber: 5,
          dependencies: [
            "Agent 3: Research Dossier",
            "Marketing Brief",
            "Selected Theme",
          ],
          outputs: ["LinkedIn Posts", "B2B Content", "Engagement Optimized"],
        },
        agent4c: {
          id: "agent4c",
          name: "Agent 4c: Social Writer",
          description:
            "Produces viral Twitter content focused on engagement, shareability, and conversation starters.",
          model: "Claude Sonnet 4",
          status: "active",
          purpose: "Produce viral Twitter content",
          stepNumber: 6,
          dependencies: [
            "Agent 3: Research Dossier",
            "Marketing Brief",
            "Selected Theme",
          ],
          outputs: ["Twitter Posts", "Viral Content", "Engagement Hooks"],
        },
        agent5a: {
          id: "agent5a",
          name: "Agent 5a: Article Editor",
          description:
            "Proofreads and edits article drafts using The Economist style guide for grammar, clarity, and flow.",
          model: "Claude Sonnet 4",
          status: "active",
          purpose: "Proofread and edit article drafts",
          stepNumber: 7,
          dependencies: [
            "Agent 4a: Article Draft",
            "The Economist Style Guide",
          ],
          outputs: [
            "Polished Articles",
            "Grammar Corrections",
            "Style Improvements",
          ],
        },
        agent5b: {
          id: "agent5b",
          name: "Agent 5b: LinkedIn Editor",
          description:
            "Enhances LinkedIn posts for maximum B2B engagement while maintaining professional credibility.",
          model: "Claude Sonnet 4",
          status: "active",
          purpose: "Enhance LinkedIn posts for maximum engagement",
          stepNumber: 8,
          dependencies: ["Agent 4b: LinkedIn Draft", "B2B Best Practices"],
          outputs: [
            "Enhanced LinkedIn Posts",
            "Engagement Optimization",
            "Professional Tone",
          ],
        },
        agent5c: {
          id: "agent5c",
          name: "Agent 5c: Social Editor",
          description:
            "Optimizes social media posts for viral potential, platform-specific best practices, and engagement.",
          model: "Claude Sonnet 4",
          status: "active",
          purpose: "Optimize social posts for viral potential",
          stepNumber: 9,
          dependencies: ["Agent 4c: Social Draft", "Platform Best Practices"],
          outputs: [
            "Optimized Social Posts",
            "Viral Optimization",
            "Platform Specific",
          ],
        },
      };

      return agentMap[id] || null;
    };

    setAgentData(getAgentData(agentId));
  }, [agentId]);

  if (!agentData) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          Agent not found: {agentId}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold text-blue-700">
              {agentData.stepNumber}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {agentData.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{agentData.purpose}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(agentData.status)}`}
        >
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          {agentData.status}
        </span>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
        <p className="text-sm text-gray-700 leading-relaxed">
          {agentData.description}
        </p>
      </div>

      {/* Model Info */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Model Configuration
        </h4>
        <div className="flex items-center text-sm text-gray-600">
          <CpuChipIcon className="h-4 w-4 mr-2" />
          <span>{agentData.model}</span>
        </div>
      </div>

      {/* Workflow Dependencies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Dependencies
          </h4>
          <div className="space-y-2">
            {agentData.dependencies.map((dep, index) => (
              <div
                key={index}
                className="flex items-center text-sm text-gray-600"
              >
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                {dep}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Outputs</h4>
          <div className="space-y-2">
            {agentData.outputs.map((output, index) => (
              <div
                key={index}
                className="flex items-center text-sm text-gray-600"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                {output}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workflow Position */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Workflow Position
        </h4>
        <p className="text-sm text-gray-600">
          This agent is step <strong>{agentData.stepNumber}</strong> in the
          content generation workflow. It processes inputs from previous agents
          and produces outputs for subsequent steps.
        </p>
      </div>
    </div>
  );
}
