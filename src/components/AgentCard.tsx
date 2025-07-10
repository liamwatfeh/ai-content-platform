"use client";

import Link from "next/link";
import { ChevronRightIcon, CpuChipIcon } from "@heroicons/react/24/outline";

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  status: string;
}

interface AgentCardProps {
  agent: Agent;
  stepNumber: number;
}

export default function AgentCard({ agent, stepNumber }: AgentCardProps) {
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
    <Link href={`/agent-config/${agent.id}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Step Number */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-700">
                  {stepNumber}
                </span>
              </div>
            </div>

            {/* Agent Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {agent.name}
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}
                >
                  {agent.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {agent.description}
              </p>

              <div className="flex items-center text-xs text-gray-500">
                <CpuChipIcon className="h-4 w-4 mr-1" />
                <span>{agent.model}</span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0 ml-4">
            <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-500" />
          </div>
        </div>
      </div>
    </Link>
  );
}
