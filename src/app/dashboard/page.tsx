"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlusIcon, SparklesIcon } from "@heroicons/react/24/outline";
import Sidebar from "@/components/Sidebar";
import DesignShowcase from "@/components/DesignShowcase";
import DashboardCard from "@/components/DashboardCard";
import StatBar from "@/components/StatBar";
import QuickActions from "@/components/QuickActions";
import ActivityFeed from "@/components/ActivityFeed";

// Updated interfaces to match new database structure
interface DashboardStats {
  reference_buckets: number;
  whitepapers: number;
  total_chunks: number;
  content_generations: number;
}

interface ActivityItem {
  id: string;
  type: "upload" | "generation" | "completion";
  title: string;
  subtitle?: string;
  timestamp: string;
  status?: "completed" | "processing" | "failed";
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDesignSystem, setShowDesignSystem] = useState(false);

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Mock stats with realistic numbers
      const mockStats: DashboardStats = {
        reference_buckets: 3,
        whitepapers: 8,
        total_chunks: 1247,
        content_generations: 24,
      };
      setStats(mockStats);

      // Mock recent activities
      const mockActivities: ActivityItem[] = [
        {
          id: "1",
          type: "generation",
          title: "LinkedIn Article Generated",
          subtitle: "From whitepaper: AI in Healthcare 2024",
          timestamp: "2 hours ago",
          status: "completed",
        },
        {
          id: "2",
          type: "upload",
          title: "Whitepaper Processed",
          subtitle: "Quantum Computing Trends.pdf",
          timestamp: "1 day ago",
          status: "completed",
        },
        {
          id: "3",
          type: "generation",
          title: "Social Media Campaign",
          subtitle: "5 posts generated for Twitter",
          timestamp: "2 days ago",
          status: "completed",
        },
      ];
      setRecentActivities(mockActivities);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f7ff] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
          <p className="text-body text-gray-600">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (showDesignSystem) {
    return (
      <div className="min-h-screen bg-[#f6f7ff]">
        <Sidebar />
        <div className="lg:pl-72">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-h1 text-brilliant-blue">Design System</h1>
              <button
                onClick={() => setShowDesignSystem(false)}
                className="btn btn-secondary"
              >
                Back to Dashboard
              </button>
            </div>
            <DesignShowcase />
          </div>
        </div>
      </div>
    );
  }

  const hasWhitepapers = (stats?.whitepapers || 0) > 0;

  return (
    <>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Dashboard Container */}
      <DashboardCard>
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-display text-gray-900 mb-6"
          >
            Welcome to{" "}
            <span className="text-brilliant-blue">Content Brain</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Link href="/whitepapers">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-accent btn-lg text-h4 px-12 py-6 shadow-[0_0_30px_rgba(226,252,11,0.4)] hover:shadow-[0_0_40px_rgba(226,252,11,0.6)]"
              >
                <PlusIcon className="h-6 w-6" />
                Upload Whitepaper
              </motion.button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-body-lg text-gray-600"
          >
            You've generated{" "}
            <span className="font-bold text-brilliant-blue bg-brilliant-blue/10 px-3 py-1 rounded-full">
              {stats?.content_generations || 0} campaigns
            </span>{" "}
            this month. Ready for the next one?
          </motion.p>
        </motion.div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-12"></div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-12"
        >
          <StatBar stats={stats!} />
        </motion.div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-12"></div>

        {/* Quick Actions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mb-12"
        >
          <QuickActions hasWhitepapers={hasWhitepapers} />
        </motion.div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-12"></div>

        {/* Recent Activity Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <ActivityFeed activities={recentActivities} />
        </motion.div>

        {/* Debug Controls */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setShowDesignSystem(true)}
              className="btn btn-secondary"
            >
              View Design System
            </button>
            <button onClick={loadDashboardData} className="btn btn-secondary">
              Refresh Data
            </button>
          </div>
        </div>
      </DashboardCard>
    </>
  );
}
