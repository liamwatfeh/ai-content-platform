"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "blue" | "yellow" | "pink";
  glowColor?: string;
}

const colorClasses = {
  blue: {
    icon: "text-brilliant-blue",
    bg: "bg-brilliant-blue/10",
    hover: "group-hover:bg-brilliant-blue/20",
    glow: "hover:shadow-[0_0_30px_rgba(7,0,255,0.3)]",
  },
  yellow: {
    icon: "text-black",
    bg: "bg-neon-yellow/20",
    hover: "group-hover:bg-neon-yellow/40",
    glow: "hover:shadow-[0_0_30px_rgba(226,252,11,0.4)]",
  },
  pink: {
    icon: "text-hot-pink",
    bg: "bg-hot-pink/10",
    hover: "group-hover:bg-hot-pink/20",
    glow: "hover:shadow-[0_0_30px_rgba(245,10,104,0.3)]",
  },
};

export default function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
  color,
}: QuickActionCardProps) {
  const classes = colorClasses[color];

  return (
    <Link href={href}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.03, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className={`card card-interactive p-8 group cursor-pointer border-2 border-transparent hover:border-${color === "blue" ? "brilliant-blue" : color === "yellow" ? "neon-yellow" : "hot-pink"}/30 ${classes.glow} transition-all duration-300`}
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <motion.div
            whileHover={{ rotate: 5 }}
            className={`${classes.bg} ${classes.hover} rounded-brilliant-xl p-6 transition-colors duration-300`}
          >
            <Icon className={`h-12 w-12 ${classes.icon}`} />
          </motion.div>

          <div>
            <h3 className="text-h3 text-gray-900 mb-2">{title}</h3>
            <p className="text-body text-gray-600 max-w-sm">{description}</p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className={`w-full h-1 bg-gradient-to-r ${
              color === "blue"
                ? "from-brilliant-blue to-brilliant-blue/50"
                : color === "yellow"
                  ? "from-neon-yellow to-neon-yellow/50"
                  : "from-hot-pink to-hot-pink/50"
            } rounded-full transition-opacity duration-300`}
          />
        </div>
      </motion.div>
    </Link>
  );
}
