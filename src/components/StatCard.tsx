"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: "blue" | "yellow" | "pink" | "green";
  delay?: number;
}

const colorClasses = {
  blue: {
    icon: "text-brilliant-blue",
    bg: "bg-brilliant-blue/10",
    border: "border-brilliant-blue/20",
  },
  yellow: {
    icon: "text-black",
    bg: "bg-neon-yellow/20",
    border: "border-neon-yellow/30",
  },
  pink: {
    icon: "text-hot-pink",
    bg: "bg-hot-pink/10",
    border: "border-hot-pink/20",
  },
  green: {
    icon: "text-green-600",
    bg: "bg-green-100",
    border: "border-green-200",
  },
};

export default function StatCard({ title, value, icon: Icon, color, delay = 0 }: StatCardProps) {
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
      className={`card card-interactive p-6 border-2 ${classes.border} hover:shadow-brilliant-lg transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-body-sm font-medium text-gray-600 mb-2">{title}</p>
          <motion.div className="text-h1 font-bold text-gray-900">
            {rounded}
          </motion.div>
        </div>
        <div className={`${classes.bg} rounded-brilliant-lg p-4`}>
          <Icon className={`h-8 w-8 ${classes.icon}`} />
        </div>
      </div>
    </motion.div>
  );
} 