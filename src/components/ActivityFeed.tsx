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

interface ActivityFeedProps {
  activities: ActivityItem[];
  hasWhitepapers: boolean;
}

const activityIcons = {
  upload: DocumentIcon,
  generation: SparklesIcon,
  completion: CheckCircleIcon,
};

const statusColors = {
  completed: "text-emerald-700 bg-emerald-50 ring-emerald-200",
  processing: "text-amber-700 bg-amber-50 ring-amber-200",
  failed: "text-red-700 bg-red-50 ring-red-200",
};

export default function ActivityFeed({
  activities,
  hasWhitepapers,
}: ActivityFeedProps) {
  if (!hasWhitepapers) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 text-center">
          Recent Activity
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-3xl p-12 text-center ring-1 ring-gray-100 shadow-sm"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.0, type: "spring", stiffness: 200 }}
            className="bg-blue-50 rounded-3xl p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center ring-1 ring-blue-100"
          >
            <DocumentIcon className="h-16 w-16 text-blue-600" />
          </motion.div>

          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ready to get started?
          </h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto mb-8 leading-relaxed">
            Upload your first whitepaper to begin transforming research into
            engaging content across multiple formats.
          </p>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button className="bg-brilliant-blue text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm">
              <DocumentIcon className="h-5 w-5 inline mr-2" />
              Upload Your First Whitepaper
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 text-center">
          Recent Activity
        </h2>
        <div className="bg-white rounded-3xl p-8 text-center ring-1 ring-gray-100 shadow-sm">
          <div className="loading-spinner h-8 w-8 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Loading Recent Activity
          </h3>
          <p className="text-sm text-gray-600">
            Fetching your latest content generation activities...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-xl font-semibold text-gray-900 text-center"
      >
        Recent Activity
      </motion.h2>

      <div className="bg-white rounded-3xl ring-1 ring-gray-100 divide-y divide-gray-50 shadow-sm overflow-hidden">
        {activities.map((activity, index) => {
          const Icon = activityIcons[activity.type];
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="p-6 hover:bg-gray-50/50 transition-colors duration-200"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-blue-50 rounded-2xl p-3 flex-shrink-0 ring-1 ring-blue-100">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {activity.title}
                    </h4>
                    {activity.status && (
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${statusColors[activity.status]}`}
                      >
                        {activity.status.charAt(0).toUpperCase() +
                          activity.status.slice(1)}
                      </span>
                    )}
                  </div>
                  {activity.subtitle && (
                    <p className="text-xs text-gray-600 truncate">
                      {activity.subtitle}
                    </p>
                  )}
                </div>

                <div className="flex items-center text-gray-400 flex-shrink-0">
                  <ClockIcon className="h-4 w-4 mr-1.5" />
                  <span className="text-xs font-medium">
                    {activity.timestamp}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
          View All Activity →
        </button>
      </div>
    </div>
  );
}
