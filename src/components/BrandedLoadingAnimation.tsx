import { motion } from "framer-motion";

interface BrandedLoadingAnimationProps {
  variant?: "brain" | "wave" | "dots";
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
}

export default function BrandedLoadingAnimation({
  variant = "brain",
  size = "md",
  message,
  className = "",
}: BrandedLoadingAnimationProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const BrainAnimation = () => (
    <div className={`${sizeClasses[size]} relative`}>
      {/* Brain outline */}
      <motion.div
        className="absolute inset-0 border-2 border-blue-600 rounded-full"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Neural connections */}
      <motion.div className="absolute inset-2 flex items-center justify-center">
        <motion.div
          className="w-1 h-1 bg-blue-600 rounded-full"
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: 0,
          }}
        />
        <motion.div
          className="w-1 h-1 bg-blue-600 rounded-full ml-1"
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: 0.2,
          }}
        />
        <motion.div
          className="w-1 h-1 bg-blue-600 rounded-full ml-1"
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: 0.4,
          }}
        />
      </motion.div>
    </div>
  );

  const WaveAnimation = () => (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center space-x-1`}
    >
      {[0, 1, 2, 3, 4].map((index) => (
        <motion.div
          key={index}
          className="w-1 bg-blue-600 rounded-full"
          animate={{
            height: ["20%", "100%", "20%"],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );

  const DotsAnimation = () => (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center space-x-1`}
    >
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-2 h-2 bg-blue-600 rounded-full"
          animate={{
            scale: [0.5, 1.2, 0.5],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: index * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );

  const getAnimation = () => {
    switch (variant) {
      case "brain":
        return <BrainAnimation />;
      case "wave":
        return <WaveAnimation />;
      case "dots":
        return <DotsAnimation />;
      default:
        return <BrainAnimation />;
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-4 ${className}`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {getAnimation()}
      </motion.div>

      {message && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-600 text-center font-medium"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}
