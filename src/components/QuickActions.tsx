"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface QuickActionsProps {
  hasWhitepapers: boolean;
}

interface ActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "blue" | "yellow" | "pink";
  index: number;
}

const colorClasses = {
  blue: {
    icon: "text-blue-600",
    bg: "bg-blue-50",
    ring: "ring-blue-100",
    hover: "hover:ring-blue-200 hover:bg-blue-50/80",
  },
  yellow: {
    icon: "text-amber-600",
    bg: "bg-amber-50",
    ring: "ring-amber-100",
    hover: "hover:ring-amber-200 hover:bg-amber-50/80",
  },
  pink: {
    icon: "text-pink-600",
    bg: "bg-pink-50",
    ring: "ring-pink-100",
    hover: "hover:ring-pink-200 hover:bg-pink-50/80",
  },
};

function ActionCard({
  title,
  description,
  href,
  icon: Icon,
  color,
  index,
}: ActionCardProps) {
  const classes = colorClasses[color];

  return (
    <Link href={href}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className={`group bg-white rounded-3xl p-8 ring-1 ${classes.ring} ${classes.hover} cursor-pointer transition-all duration-300 shadow-sm hover:shadow-lg relative overflow-hidden`}
      >
        {/* Background pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
          <div
            className={`w-full h-full ${classes.bg} rounded-full transform translate-x-16 -translate-y-16`}
          />
        </div>

        <div className="relative flex flex-col space-y-4">
          <div
            className={`${classes.bg} rounded-2xl p-4 w-fit ring-1 ${classes.ring} group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className={`h-8 w-8 ${classes.icon}`} />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {description}
            </p>
          </div>

          <div className="flex items-center text-sm font-medium text-gray-400 group-hover:text-gray-600 transition-colors">
            <span>Get started</span>
            <svg
              className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function QuickActions({ hasWhitepapers }: QuickActionsProps) {
  const actions = [
    {
      title: "Upload & Manage",
      description:
        "Upload new whitepapers and organize your research documents for AI processing",
      href: "/whitepapers",
      icon: require("@heroicons/react/24/outline").DocumentIcon,
      color: "blue" as const,
    },
    {
      title: "Generate Content",
      description:
        "Transform your whitepapers into articles, social media posts, and marketing content",
      href: "/generate-content",
      icon: require("@heroicons/react/24/outline").SparklesIcon,
      color: "yellow" as const,
    },
    {
      title: "View History",
      description:
        "Review your content generation history and manage previous campaigns",
      href: "/history",
      icon: require("@heroicons/react/24/outline").EyeIcon,
      color: "pink" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xl font-semibold text-gray-900 text-center"
      >
        Quick Actions
      </motion.h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {actions.map((action, index) => (
          <ActionCard
            key={action.title}
            title={action.title}
            description={action.description}
            href={action.href}
            icon={action.icon}
            color={action.color}
            index={index}
          />
        ))}
      </div>

      {!hasWhitepapers && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 text-center backdrop-blur-sm"
        >
          <p className="text-sm text-blue-700 font-medium">
            🚀 <strong>Get started:</strong> Upload your first whitepaper to
            unlock the full Content Brain experience!
          </p>
        </motion.div>
      )}
    </div>
  );
}
