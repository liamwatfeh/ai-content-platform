"use client";

import { useParams } from "next/navigation";
import AgentConfigDetail from "@/components/AgentConfigDetail";

export default function AgentConfigDetailPage() {
  const params = useParams();
  const agentId = params.agentId as string;

  if (!agentId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900">Agent not found</h2>
          <p className="text-sm text-gray-600">Invalid agent ID</p>
        </div>
      </div>
    );
  }

  return <AgentConfigDetail agentId={agentId} />;
}
