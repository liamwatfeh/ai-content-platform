import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "accent" | "destructive";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
  loadingText?: string;
  type?: "button" | "submit" | "reset";
}

export default function ActionButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  className = "",
  icon,
  loadingText = "Loading...",
  type = "button",
}: ActionButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-xl relative overflow-hidden";

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const variantClasses = {
    primary:
      "bg-blue-600 text-white focus:ring-blue-500 hover:bg-blue-700 shadow-lg hover:shadow-xl",
    secondary:
      "bg-white text-gray-700 border-2 border-gray-300 focus:ring-gray-500 hover:bg-gray-50 hover:border-gray-400",
    accent:
      "bg-neon-yellow text-black focus:ring-yellow-500 hover:bg-yellow-300 shadow-lg hover:shadow-xl",
    destructive:
      "bg-white text-red-600 border-2 border-red-200 focus:ring-red-500 hover:bg-red-50 hover:border-red-300",
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={!isDisabled ? onClick : undefined}
      disabled={isDisabled}
      whileHover={
        !isDisabled
          ? {
              scale: 1.02,
              boxShadow:
                variant === "primary"
                  ? "0 8px 25px rgba(59, 130, 246, 0.15)"
                  : variant === "accent"
                    ? "0 8px 25px rgba(234, 179, 8, 0.15)"
                    : "0 4px 12px rgba(0, 0, 0, 0.1)",
            }
          : {}
      }
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? "w-full" : ""}
        ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
    >
      {/* Background animation on hover */}
      {!isDisabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          initial={{ x: "-100%" }}
          whileHover={{ x: "100%" }}
          transition={{ duration: 0.6 }}
        />
      )}

      {/* Loading state */}
      {loading && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
        />
      )}

      {/* Icon */}
      {icon && !loading && (
        <motion.div
          className="flex-shrink-0"
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {icon}
        </motion.div>
      )}

      {/* Button text */}
      <span className="relative z-10 font-semibold">
        {loading ? loadingText : children}
      </span>
    </motion.button>
  );
}
