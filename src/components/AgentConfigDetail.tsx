"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import AgentInfo from "./AgentInfo";
import AgentSchemaViewer from "./AgentSchemaViewer";
import AgentPromptEditor from "./AgentPromptEditor";
import Sidebar from "./Sidebar";

interface AgentConfigDetailProps {
  agentId: string;
}

export default function AgentConfigDetail({ agentId }: AgentConfigDetailProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", name: "Overview", description: "Agent info and status" },
    { id: "schema", name: "Input/Output", description: "Data schemas" },
    {
      id: "prompt",
      name: "System Prompt",
      description: "Editable configuration",
    },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Header with back button */}
              <div className="mb-6">
                <Link
                  href="/agent-config"
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Agent Config
                </Link>

                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                      Agent Configuration
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Configure system prompts and view agent specifications
                    </p>
                  </div>
                  <div className="mt-4 flex md:mt-0 md:ml-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Development Mode
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span>{tab.name}</span>
                        <span className="text-xs text-gray-400 font-normal">
                          {tab.description}
                        </span>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Warning Banner */}
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">
                      Development Environment
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Changes to system prompts are temporary and will be reset
                      on page reload. This interface is for testing and
                      experimentation only.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="bg-white rounded-lg shadow">
                {activeTab === "overview" && <AgentInfo agentId={agentId} />}
                {activeTab === "schema" && (
                  <AgentSchemaViewer agentId={agentId} />
                )}
                {activeTab === "prompt" && (
                  <AgentPromptEditor agentId={agentId} />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
