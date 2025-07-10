import { motion } from "framer-motion";
import { CheckIcon } from "@heroicons/react/24/solid";

interface SuccessAnimationProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  showConfetti?: boolean;
  className?: string;
}

export default function SuccessAnimation({
  message = "Success!",
  size = "md",
  showConfetti = true,
  className = "",
}: SuccessAnimationProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  // Confetti particles
  const confettiColors = [
    "bg-blue-500",
    "bg-yellow-400",
    "bg-green-500",
    "bg-pink-500",
    "bg-purple-500",
    "bg-indigo-500",
  ];

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-4 relative ${className}`}
    >
      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 12 }).map((_, index) => (
            <motion.div
              key={index}
              className={`absolute w-2 h-2 ${confettiColors[index % confettiColors.length]} rounded-full`}
              initial={{
                x: 0,
                y: 0,
                opacity: 0,
                scale: 0,
              }}
              animate={{
                x: Math.random() * 200 - 100,
                y: Math.random() * 200 - 100,
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: 2,
                delay: index * 0.1,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Success checkmark */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
          duration: 0.6,
        }}
        className={`${sizeClasses[size]} bg-green-600 rounded-full flex items-center justify-center shadow-lg`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <CheckIcon className={`${iconSizeClasses[size]} text-white`} />
        </motion.div>

        {/* Success ring animation */}
        <motion.div
          className="absolute inset-0 border-2 border-green-400 rounded-full"
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{
            duration: 1,
            delay: 0.3,
            ease: "easeOut",
          }}
        />
      </motion.div>

      {/* Success message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="text-center"
      >
        <p className="text-lg font-semibold text-green-600 mb-1">{message}</p>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
          className="h-0.5 bg-green-400 rounded-full"
        />
      </motion.div>
    </div>
  );
}
