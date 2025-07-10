"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

interface StatBarProps {
  stats: {
    reference_buckets: number;
    whitepapers: number;
    total_chunks: number;
    content_generations: number;
  };
}

interface StatItemProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: "blue" | "yellow" | "pink" | "green";
  delay?: number;
}

const colorClasses = {
  blue: {
    icon: "text-blue-600",
    bg: "bg-blue-50",
    ring: "ring-blue-100",
    accent: "bg-blue-500",
  },
  yellow: {
    icon: "text-amber-600",
    bg: "bg-amber-50",
    ring: "ring-amber-100",
    accent: "bg-amber-400",
  },
  pink: {
    icon: "text-pink-600",
    bg: "bg-pink-50",
    ring: "ring-pink-100",
    accent: "bg-pink-500",
  },
  green: {
    icon: "text-emerald-600",
    bg: "bg-emerald-50",
    ring: "ring-emerald-100",
    accent: "bg-emerald-500",
  },
};

function StatItem({
  title,
  value,
  icon: Icon,
  color,
  delay = 0,
}: StatItemProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const classes = colorClasses[color];

  useEffect(() => {
    const timer = setTimeout(() => {
      const controls = animate(count, value, {
        duration: 2,
        ease: "easeOut",
      });
      return controls.stop;
    }, delay * 200);

    return () => clearTimeout(timer);
  }, [count, value, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative bg-white rounded-2xl p-6 ring-1 ${classes.ring} hover:ring-2 hover:ring-blue-200 transition-all duration-300 shadow-sm hover:shadow-md group`}
    >
      {/* Accent line */}
      <div
        className={`absolute top-0 left-6 right-6 h-0.5 ${classes.accent} rounded-full opacity-60 group-hover:opacity-100 transition-opacity`}
      />

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <motion.div className="text-3xl font-bold text-gray-900 tracking-tight">
            {rounded}
          </motion.div>
        </div>
        <div className={`${classes.bg} rounded-2xl p-4 ring-1 ${classes.ring}`}>
          <Icon className={`h-7 w-7 ${classes.icon}`} />
        </div>
      </div>
    </motion.div>
  );
}

export default function StatBar({ stats }: StatBarProps) {
  const statItems = [
    {
      title: "Reference Buckets",
      value: stats.reference_buckets,
      icon: require("@heroicons/react/24/outline").DocumentIcon,
      color: "blue" as const,
    },
    {
      title: "Whitepapers",
      value: stats.whitepapers,
      icon: require("@heroicons/react/24/outline").DocumentTextIcon,
      color: "yellow" as const,
    },
    {
      title: "Content Chunks",
      value: stats.total_chunks,
      icon: require("@heroicons/react/24/outline").ChartBarIcon,
      color: "pink" as const,
    },
    {
      title: "Generated Content",
      value: stats.content_generations,
      icon: require("@heroicons/react/24/outline").SparklesIcon,
      color: "green" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold text-gray-900 text-center"
      >
        Your Content Overview
      </motion.h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((item, index) => (
          <StatItem
            key={item.title}
            title={item.title}
            value={item.value}
            icon={item.icon}
            color={item.color}
            delay={index}
          />
        ))}
      </div>
    </div>
  );
}
