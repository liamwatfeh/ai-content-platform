"use client";

import { motion } from "framer-motion";
import { useSidebar } from "@/contexts/SidebarContext";

interface DashboardCardProps {
  children: React.ReactNode;
}

export default function DashboardCard({ children }: DashboardCardProps) {
  const { isCollapsed } = useSidebar();

  return (
    <motion.main
      animate={{
        marginLeft: isCollapsed ? "5rem" : "18rem", // 80px : 288px
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 lg:transition-all lg:duration-300"
    >
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </div>
    </motion.main>
  );
}
