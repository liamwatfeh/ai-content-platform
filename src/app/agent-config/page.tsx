"use client";

import { useState } from "react";
import Link from "next/link";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import AgentGrid from "@/components/AgentGrid";
import Sidebar from "@/components/Sidebar";

export default function AgentConfigPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
              {/* Header */}
              <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                    Agent Configuration
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure and test AI agents in the content generation
                    workflow
                  </p>
                </div>
                <div className="mt-4 flex items-center space-x-3 md:mt-0 md:ml-4">
                  <Link
                    href="/agent-config/flowchart"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <ChartBarIcon className="h-4 w-4 mr-2" />
                    Flowchart
                  </Link>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Development Mode
                  </span>
                </div>
              </div>

              {/* Agent Grid */}
              <div className="mt-8">
                <AgentGrid />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
