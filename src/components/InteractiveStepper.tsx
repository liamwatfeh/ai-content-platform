import { motion } from "framer-motion";
import { CheckIcon } from "@heroicons/react/24/solid";

interface Step {
  number: number;
  name: string;
  completed: boolean;
}

interface InteractiveStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepNumber: number) => void;
  className?: string;
}

export default function InteractiveStepper({
  steps,
  currentStep,
  onStepClick,
  className = "",
}: InteractiveStepperProps) {
  return (
    <div className={`bg-white border-b border-gray-100 ${className}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav aria-label="Progress" className="mb-2">
          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="text-sm font-medium text-gray-500">
              Step {currentStep} of {steps.length}
            </div>
          </div>

          {/* Desktop stepper */}
          <div className="hidden md:block">
            <div className="relative">
              {/* Connecting track */}
              <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                  }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                />
              </div>

              {/* Steps */}
              <ol className="flex items-center justify-between relative z-10">
                {steps.map((step) => {
                  const isCompleted = step.completed;
                  const isCurrent = currentStep === step.number;
                  const isClickable = isCompleted && onStepClick;

                  return (
                    <li
                      key={step.number}
                      className="flex flex-col items-center"
                    >
                      <motion.button
                        onClick={() => isClickable && onStepClick(step.number)}
                        disabled={!isClickable}
                        className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                          isCompleted
                            ? "bg-blue-600 text-white shadow-lg cursor-pointer hover:bg-blue-700 hover:shadow-xl"
                            : isCurrent
                              ? "bg-white text-blue-600 border-2 border-blue-600 shadow-md"
                              : "bg-gray-100 text-gray-400 border border-gray-200"
                        } ${isClickable ? "hover:scale-105" : ""}`}
                        whileHover={isClickable ? { scale: 1.05 } : {}}
                        whileTap={isClickable ? { scale: 0.95 } : {}}
                      >
                        {isCompleted ? (
                          <CheckIcon className="w-5 h-5" />
                        ) : (
                          step.number
                        )}

                        {/* Active step pulse animation */}
                        {isCurrent && (
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-blue-400"
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [1, 0, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                        )}
                      </motion.button>

                      {/* Step label */}
                      <motion.span
                        className={`mt-3 text-sm font-medium text-center max-w-24 leading-tight ${
                          isCompleted || isCurrent
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: step.number * 0.1 }}
                      >
                        {step.name}
                      </motion.span>

                      {/* Active step underline */}
                      {isCurrent && (
                        <motion.div
                          className="mt-1 h-0.5 w-8 bg-blue-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: 32 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {/* Mobile stepper */}
          <div className="md:hidden">
            <div className="flex items-center space-x-4">
              {/* Current step circle */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  steps[currentStep - 1]?.completed
                    ? "bg-blue-600 text-white"
                    : "bg-white text-blue-600 border-2 border-blue-600"
                }`}
              >
                {steps[currentStep - 1]?.completed ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  currentStep
                )}
              </div>

              {/* Current step info */}
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-gray-900">
                  {steps[currentStep - 1]?.name}
                </p>
                <div className="mt-1">
                  <div className="bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-blue-600 h-2 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{
                        width: `${(currentStep / steps.length) * 100}%`,
                      }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile step dots */}
            <div className="flex justify-center space-x-2 mt-4">
              {steps.map((step) => (
                <motion.div
                  key={step.number}
                  className={`w-2 h-2 rounded-full ${
                    step.completed
                      ? "bg-blue-600"
                      : currentStep === step.number
                        ? "bg-blue-400"
                        : "bg-gray-300"
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: step.number * 0.1 }}
                />
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
