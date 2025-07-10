"use client";

import AgentCard from "./AgentCard";

// Agent definitions in chronological order
const agents = [
  {
    id: "agent1",
    name: "Agent 1: Brief Creator",
    description:
      "Analyzes business requirements and generates comprehensive marketing briefs with target personas, objectives, and key messages.",
    model: "Claude Sonnet 4",
    status: "active",
  },
  {
    id: "agent2",
    name: "Agent 2: Theme Generator",
    description:
      "Identifies optimal content themes and angles based on marketing brief and whitepaper analysis.",
    model: "Claude Sonnet 4",
    status: "active",
  },
  {
    id: "agent3",
    name: "Agent 3: Researcher",
    description:
      "Conducts deep research using Pinecone search to gather evidence and create comprehensive research dossiers.",
    model: "Claude Sonnet 4",
    status: "active",
  },
  {
    id: "agent4a",
    name: "Agent 4a: Article Writer",
    description:
      "Generates The Economist-style articles with guaranteed structured output and optional research capabilities.",
    model: "Claude Sonnet 4",
    status: "active",
  },
  {
    id: "agent4b",
    name: "Agent 4b: LinkedIn Writer",
    description:
      "Creates B2B thought leadership LinkedIn posts optimized for professional engagement and networking.",
    model: "Claude Sonnet 4",
    status: "active",
  },
  {
    id: "agent4c",
    name: "Agent 4c: Social Writer",
    description:
      "Produces viral Twitter content focused on engagement, shareability, and conversation starters.",
    model: "Claude Sonnet 4",
    status: "active",
  },
  {
    id: "agent5a",
    name: "Agent 5a: Article Editor",
    description:
      "Proofreads and edits article drafts using The Economist style guide for grammar, clarity, and flow.",
    model: "Claude Sonnet 4",
    status: "active",
  },
  {
    id: "agent5b",
    name: "Agent 5b: LinkedIn Editor",
    description:
      "Enhances LinkedIn posts for maximum B2B engagement while maintaining professional credibility.",
    model: "Claude Sonnet 4",
    status: "active",
  },
  {
    id: "agent5c",
    name: "Agent 5c: Social Editor",
    description:
      "Optimizes social media posts for viral potential, platform-specific best practices, and engagement.",
    model: "Claude Sonnet 4",
    status: "active",
  },
];

export default function AgentGrid() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Content Generation Workflow
        </h3>
        <p className="text-sm text-gray-600">
          Agents are executed in chronological order. Click any agent to
          configure its system prompt and view its inputs/outputs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {agents.map((agent, index) => (
          <AgentCard key={agent.id} agent={agent} stepNumber={index + 1} />
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">
              Development Mode
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              You can modify system prompts in real-time to test and refine
              agent behavior. Changes are temporary and reset on page reload.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
