"use client";

import { motion } from "framer-motion";
import {
  DocumentIcon,
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface ActivityItem {
  id: string;
  type: "upload" | "generation" | "completion";
  title: string;
  subtitle?: string;
  timestamp: string;
  status?: "completed" | "processing" | "failed";
}

interface RecentActivityProps {
  activities: ActivityItem[];
  hasWhitepapers: boolean;
}

const activityIcons = {
  upload: DocumentIcon,
  generation: SparklesIcon,
  completion: CheckCircleIcon,
};

const statusColors = {
  completed: "text-green-600",
  processing: "text-neon-yellow",
  failed: "text-hot-pink",
};

export default function RecentActivity({
  activities,
  hasWhitepapers,
}: RecentActivityProps) {
  if (!hasWhitepapers) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-12 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="bg-brilliant-blue/10 rounded-brilliant-xl p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center"
        >
          <DocumentIcon className="h-16 w-16 text-brilliant-blue" />
        </motion.div>

        <h3 className="text-h3 text-gray-900 mb-4">Ready to get started?</h3>
        <p className="text-body text-gray-600 max-w-md mx-auto mb-8">
          Upload your first whitepaper to begin transforming research into
          engaging content across multiple formats.
        </p>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <button className="btn btn-accent btn-lg">
            <DocumentIcon className="h-5 w-5" />
            Upload Your First Whitepaper
          </button>
        </motion.div>
      </motion.div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
        <h3 className="text-h4 text-gray-900 mb-2">Loading Recent Activity</h3>
        <p className="text-body text-gray-600">
          Fetching your latest content generation activities...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const Icon = activityIcons[activity.type];
        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-6 hover:shadow-brilliant transition-shadow duration-300"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-brilliant-blue/10 rounded-brilliant p-3">
                <Icon className="h-6 w-6 text-brilliant-blue" />
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-body font-semibold text-gray-900">
                    {activity.title}
                  </h4>
                  {activity.status && (
                    <span
                      className={`text-caption font-medium ${statusColors[activity.status]}`}
                    >
                      {activity.status.charAt(0).toUpperCase() +
                        activity.status.slice(1)}
                    </span>
                  )}
                </div>
                {activity.subtitle && (
                  <p className="text-body-sm text-gray-600">
                    {activity.subtitle}
                  </p>
                )}
              </div>

              <div className="flex items-center text-gray-400">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span className="text-caption">{activity.timestamp}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
