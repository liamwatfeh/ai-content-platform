"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XMarkIcon,
  SparklesIcon,
  ClockIcon,
  Bars3Icon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";
import PDFThumbnail from "@/components/PDFThumbnail";
import Sidebar from "@/components/Sidebar";
import InteractiveStepper from "@/components/InteractiveStepper";
import ActionButton from "@/components/ActionButton";
import BrandedLoadingAnimation from "@/components/BrandedLoadingAnimation";
import SuccessAnimation from "@/components/SuccessAnimation";
import HelpTooltip from "@/components/HelpTooltip";
import { useSidebar } from "@/contexts/SidebarContext";

// Updated Types to match backend API
interface Whitepaper {
  id: string;
  reference_bucket_id: string;
  title: string;
  filename: string;
  file_url: string;
  pinecone_namespace: string;
  upload_date: string;
  processing_status: "uploading" | "processing" | "completed" | "failed";
  chunk_count: number;
  file_size_bytes: number;
  content_type: string;
}

// Updated to match backend API format
interface BriefData {
  businessContext: string;
  targetAudience: string;
  marketingGoals: string;
  articlesCount: number;
  linkedinPostsCount: number;
  socialPostsCount: number;
  ctaType: "download_whitepaper" | "contact_us";
  ctaUrl?: string;
}

// Updated to match backend Theme schema
interface Theme {
  id: string;
  title: string;
  description: string;
  whyItWorks: string[];
  detailedDescription: string;
}

interface ReferenceBucket {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface WorkflowState {
  currentStep: string;
  needsHumanInput: boolean;
  isComplete: boolean;
  regenerationCount?: number;
  searchesPerformed?: number;
}

export default function GenerateContentPage() {
  const searchParams = useSearchParams();
  const preSelectedWhitepaperID = searchParams.get("whitepaper");
  const { isCollapsed, sidebarOpen, setSidebarOpen } = useSidebar();

  const [currentStep, setCurrentStep] = useState(1);

  // PHASE 1: Simplified State Management - Single source of truth
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [whitepapers, setWhitepapers] = useState<Whitepaper[]>([]);
  const [loadingWhitepapers, setLoadingWhitepapers] = useState(true);

  // Computed value from single source of truth
  const selectedWhitepaper = useMemo(
    () => whitepapers.find((wp) => wp.id === selectedId) || null,
    [whitepapers, selectedId]
  );

  // PHASE 1: Atomic and predictable selection handler
  const handleWhitepaperSelection = useCallback((whitepaper: Whitepaper) => {
    setSelectedId(whitepaper.id);
  }, []);

  // Keyboard navigation state
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const [briefData, setBriefData] = useState<BriefData>({
    businessContext: "",
    targetAudience: "",
    marketingGoals: "",
    articlesCount: 1,
    linkedinPostsCount: 4,
    socialPostsCount: 8,
    ctaType: "contact_us",
  });

  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(
    null
  );
  const [currentWorkflowState, setCurrentWorkflowState] = useState<{
    marketing_brief?: string;
    generated_themes?: Theme[];
    workflow_state?: WorkflowState;
  } | null>(null);

  // Add state for final results
  const [finalResults, setFinalResults] = useState<any>(null);

  // Stepper collapse state with localStorage persistence
  const [isStepperCollapsed, setIsStepperCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("stepperCollapsed");
      return saved ? JSON.parse(saved) : false; // Default to expanded
    }
    return false;
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBucketId, setSelectedBucketId] = useState<string>("");
  const [referenceBuckets, setReferenceBuckets] = useState<ReferenceBucket[]>(
    []
  );

  // PHASE 1: Simplified filtered whitepapers
  const filteredWhitepapers = useMemo(() => {
    return whitepapers.filter((whitepaper) => {
      const matchesSearch =
        !searchTerm ||
        whitepaper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        whitepaper.filename.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBucket =
        !selectedBucketId ||
        whitepaper.reference_bucket_id === selectedBucketId;

      return matchesSearch && matchesBucket;
    });
  }, [whitepapers, searchTerm, selectedBucketId]);

  // Reset selection if selected whitepaper disappears from filtered list
  useEffect(() => {
    if (selectedId && !filteredWhitepapers.find((wp) => wp.id === selectedId)) {
      setSelectedId(null);
      setFocusedIndex(0);
    }
  }, [selectedId, filteredWhitepapers]);

  // PHASE 4: Enhanced keyboard navigation handler
  const handleKeyboardNavigation = useCallback(
    (e: KeyboardEvent) => {
      if (!filteredWhitepapers.length) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) =>
            Math.min(prev + 1, filteredWhitepapers.length - 1)
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (filteredWhitepapers[focusedIndex]) {
            handleWhitepaperSelection(filteredWhitepapers[focusedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setSelectedId(null);
          setFocusedIndex(0);
          break;
      }
    },
    [filteredWhitepapers, focusedIndex, handleWhitepaperSelection]
  );

  // Add keyboard navigation listeners
  useEffect(() => {
    document.addEventListener("keydown", handleKeyboardNavigation);
    return () =>
      document.removeEventListener("keydown", handleKeyboardNavigation);
  }, [handleKeyboardNavigation]);

  const steps = [
    { number: 1, name: "Select Whitepaper", completed: currentStep > 1 },
    { number: 2, name: "Create Brief", completed: currentStep > 2 },
    { number: 3, name: "Choose Theme", completed: currentStep > 3 },
    { number: 4, name: "Generate & Edit Content", completed: currentStep > 4 },
  ];

  useEffect(() => {
    loadWhitepapers();
    loadReferenceBuckets();
  }, []);

  // Track selection changes for debugging (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && selectedWhitepaper) {
      console.log("Selected whitepaper:", selectedWhitepaper.title);
    }
  }, [selectedWhitepaper]);

  const loadWhitepapers = async () => {
    try {
      setLoadingWhitepapers(true);
      const response = await fetch("/api/whitepapers");
      const data = await response.json();

      if (data.success) {
        const completedWhitepapers = data.whitepapers.filter(
          (wp: Whitepaper) => wp.processing_status === "completed"
        );
        setWhitepapers(completedWhitepapers);

        if (preSelectedWhitepaperID) {
          const preSelected = completedWhitepapers.find(
            (wp: Whitepaper) => wp.id === preSelectedWhitepaperID
          );
          if (preSelected) {
            setSelectedId(preSelected.id); // Use setSelectedId to trigger re-render
          }
        }
      }
    } catch (error) {
      console.error("Error loading whitepapers:", error);
      setError("Failed to load whitepapers");
    } finally {
      setLoadingWhitepapers(false);
    }
  };

  const loadReferenceBuckets = async () => {
    try {
      const response = await fetch("/api/reference-buckets");
      const data = await response.json();

      if (data.success) {
        setReferenceBuckets(data.buckets);
      }
    } catch (error) {
      console.error("Error loading reference buckets:", error);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  // Toggle stepper collapse with localStorage persistence
  const toggleStepperCollapse = useCallback(() => {
    const newCollapsed = !isStepperCollapsed;
    setIsStepperCollapsed(newCollapsed);
    if (typeof window !== "undefined") {
      localStorage.setItem("stepperCollapsed", JSON.stringify(newCollapsed));
    }
  }, [isStepperCollapsed]);

  const handleNext = () => {
    if (currentStep === 1 && selectedWhitepaper) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (
        briefData.businessContext.trim() &&
        briefData.targetAudience.trim() &&
        briefData.marketingGoals.trim()
      ) {
        generateThemes();
      }
    } else if (currentStep === 3 && selectedTheme) {
      handleThemeSelection();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Real API call to generate themes
  const generateThemes = async () => {
    if (!selectedWhitepaper) {
      setError("No whitepaper selected");
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentStep(3);

    try {
      console.log("🚀 Calling theme generation API...", briefData);
      console.log(
        "📄 Selected whitepaper:",
        selectedWhitepaper.id,
        selectedWhitepaper.title
      );

      const response = await fetch("/api/generate-themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...briefData,
          selectedWhitepaperId: selectedWhitepaper.id,
        }),
      });

      const data = await response.json();
      console.log("📥 API Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate themes");
      }

      if (data.success && data.generated_themes) {
        setThemes(data.generated_themes);
        setWorkflowState(data.workflow_state);
        setCurrentWorkflowState(data);
        console.log(
          "✅ Themes generated successfully:",
          data.generated_themes.length
        );
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("❌ Theme generation error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to generate themes"
      );
      setCurrentStep(2);
    } finally {
      setLoading(false);
    }
  };

  // Real API call to regenerate themes
  const regenerateThemes = async () => {
    if (!currentWorkflowState || !selectedWhitepaper) {
      setError("No previous workflow state or whitepaper selected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("🔄 Regenerating themes...");

      const response = await fetch("/api/generate-themes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "regenerate_themes",
          currentState: {
            ...briefData,
            selectedWhitepaperId: selectedWhitepaper.id,
            generatedThemes: themes,
            previousThemes: [],
            searchHistory: [],
            regenerationCount: workflowState?.regenerationCount || 0,
            currentStep: "awaiting_theme_selection",
            needsHumanInput: true,
            marketingBrief: currentWorkflowState.marketing_brief
              ? JSON.stringify(currentWorkflowState.marketing_brief)
              : undefined,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to regenerate themes");
      }

      if (data.success && data.generated_themes) {
        setThemes(data.generated_themes);
        setWorkflowState(data.workflow_state);
        setSelectedTheme(null);
        console.log(
          "✅ Themes regenerated successfully:",
          data.generated_themes.length
        );
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("❌ Theme regeneration error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to regenerate themes"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle theme selection and run complete workflow
  const handleThemeSelection = async () => {
    if (!selectedTheme || !selectedWhitepaper) {
      setError("No theme selected or whitepaper not selected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(
        "🚀 Running complete workflow with selected theme:",
        selectedTheme.title
      );

      // Prepare the complete workflow payload
      const payload = {
        businessContext: briefData.businessContext,
        targetAudience: briefData.targetAudience,
        marketingGoals: briefData.marketingGoals,
        articlesCount: briefData.articlesCount,
        linkedinPostsCount: briefData.linkedinPostsCount,
        socialPostsCount: briefData.socialPostsCount,
        ctaType: briefData.ctaType,
        ctaUrl: briefData.ctaUrl,
        selectedWhitepaperId: selectedWhitepaper.id,
        marketingBrief: currentWorkflowState?.marketing_brief
          ? JSON.stringify(currentWorkflowState.marketing_brief)
          : undefined,
        generatedThemes: themes,
        selectedTheme,
        currentStep: "theme_selected",
        needsHumanInput: false,
        isComplete: false,
      };

      console.log("📤 Sending complete workflow payload:", payload);

      // Call the complete workflow API
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Content generation failed");
      }

      if (data.success) {
        console.log("✅ Complete workflow successful:", data.data);
        setFinalResults(data.data);
        setCurrentStep(4);
      } else {
        throw new Error(data.error || "Invalid response format");
      }
    } catch (error) {
      console.error("❌ Content generation error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to generate content"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div
        className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? "lg:ml-20" : "lg:ml-80"
        }`}
      >
        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none pb-20 sm:pb-0">
          {/* Top bar */}
          <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
            <button
              className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>

          {/* Collapsible Interactive Step Indicator */}
          <motion.div
            className="bg-gradient-to-r from-blue-50 via-white to-blue-50 border-b border-blue-100 shadow-sm sticky top-0 z-10"
            animate={{ height: isStepperCollapsed ? "auto" : "auto" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8">
              <nav aria-label="Progress">
                {/* Collapsed State - Thin Progress Bar */}
                {isStepperCollapsed ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="py-3"
                  >
                    <div className="max-w-4xl mx-auto flex items-center gap-4">
                      {/* Thin Progress Line with Mini Steps */}
                      <div className="flex-1 flex items-center gap-3">
                        {steps.map((step, index) => {
                          const isCompleted = step.completed;
                          const isCurrent = currentStep === step.number;
                          const isClickable = isCompleted;

                          return (
                            <div
                              key={step.number}
                              className="flex items-center"
                            >
                              {/* Mini Step Circle */}
                              <motion.button
                                onClick={() =>
                                  isClickable && setCurrentStep(step.number)
                                }
                                disabled={!isClickable}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                                  isCompleted
                                    ? "bg-blue-600 text-white cursor-pointer hover:bg-blue-700"
                                    : isCurrent
                                      ? "bg-white text-blue-600 border-2 border-blue-600"
                                      : "bg-gray-200 text-gray-400"
                                }`}
                                whileHover={isClickable ? { scale: 1.1 } : {}}
                                whileTap={isClickable ? { scale: 0.9 } : {}}
                              >
                                {isCompleted ? (
                                  <CheckIcon className="w-3 h-3" />
                                ) : (
                                  <span className="font-unbounded text-xs">
                                    {step.number}
                                  </span>
                                )}
                              </motion.button>

                              {/* Connecting Line */}
                              {index < steps.length - 1 && (
                                <div className="w-12 sm:w-16 h-0.5 mx-2 bg-gray-200 relative">
                                  <motion.div
                                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                                    initial={{ width: "0%" }}
                                    animate={{
                                      width: step.completed ? "100%" : "0%",
                                    }}
                                    transition={{ duration: 0.5 }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Current Step Name */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900 font-archivo">
                          Step {currentStep}: {steps[currentStep - 1]?.name}
                        </span>

                        {/* Expand Button */}
                        <motion.button
                          onClick={toggleStepperCollapse}
                          className="group bg-white border-2 border-blue-100 hover:border-blue-200 rounded-2xl px-3 py-2 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
                          whileHover={{ scale: 1.02, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="text-sm font-medium text-gray-600 group-hover:text-gray-800">
                            Expand
                          </span>
                          <ChevronDownIcon className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* Expanded State - Full Stepper */
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="py-4 sm:py-6 lg:py-8"
                  >
                    {/* Desktop stepper */}
                    <div className="hidden sm:block">
                      <div className="relative max-w-4xl mx-auto">
                        {/* Connecting track with gradient */}
                        <div className="absolute top-6 left-0 w-full h-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full">
                          <motion.div
                            className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 rounded-full shadow-sm"
                            initial={{ width: "0%" }}
                            animate={{
                              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                            }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                          />
                        </div>

                        {/* Steps */}
                        <ol className="flex items-center justify-between relative z-10">
                          {steps.map((step) => {
                            const isCompleted = step.completed;
                            const isCurrent = currentStep === step.number;
                            const isClickable = isCompleted;

                            return (
                              <li
                                key={step.number}
                                className="flex flex-col items-center group"
                              >
                                <motion.button
                                  onClick={() =>
                                    isClickable && setCurrentStep(step.number)
                                  }
                                  disabled={!isClickable}
                                  className={`relative w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 shadow-lg ${
                                    isCompleted
                                      ? "bg-blue-600 text-white shadow-blue-200 cursor-pointer hover:bg-blue-700 hover:shadow-blue-300"
                                      : isCurrent
                                        ? "bg-white text-blue-600 border-2 sm:border-3 border-blue-600 shadow-blue-100"
                                        : "bg-white text-gray-400 border-2 border-gray-200 shadow-gray-100"
                                  }`}
                                  whileHover={
                                    isClickable
                                      ? { scale: 1.1, y: -2 }
                                      : isCurrent
                                        ? { scale: 1.05 }
                                        : {}
                                  }
                                  whileTap={isClickable ? { scale: 0.95 } : {}}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{
                                    delay: step.number * 0.1,
                                    type: "spring",
                                  }}
                                >
                                  {isCompleted ? (
                                    <CheckIcon className="w-4 sm:w-6 h-4 sm:h-6" />
                                  ) : (
                                    <span className="font-unbounded">
                                      {step.number}
                                    </span>
                                  )}

                                  {/* Active step glow effect */}
                                  {isCurrent && (
                                    <motion.div
                                      className="absolute inset-0 rounded-full border-2 border-blue-400 opacity-60"
                                      animate={{
                                        scale: [1, 1.3, 1],
                                        opacity: [0.6, 0, 0.6],
                                      }}
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                      }}
                                    />
                                  )}
                                </motion.button>

                                {/* Step label with enhanced typography */}
                                <motion.div
                                  className="mt-2 sm:mt-4 text-center"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{
                                    delay: step.number * 0.1 + 0.2,
                                  }}
                                >
                                  <span
                                    className={`block text-xs sm:text-sm font-semibold font-archivo leading-tight ${
                                      isCompleted || isCurrent
                                        ? "text-gray-900"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {step.name}
                                  </span>

                                  {/* Active step accent bar */}
                                  {isCurrent && (
                                    <motion.div
                                      className="mt-1 sm:mt-2 h-0.5 sm:h-1 w-8 sm:w-12 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full mx-auto"
                                      initial={{ width: 0 }}
                                      animate={{ width: "100%" }}
                                      transition={{ duration: 0.5, delay: 0.3 }}
                                    />
                                  )}
                                </motion.div>
                              </li>
                            );
                          })}
                        </ol>
                      </div>

                      {/* Prominent Collapse Button at Bottom */}
                      <div className="flex justify-center mt-6">
                        <motion.button
                          onClick={toggleStepperCollapse}
                          className="group bg-white border-2 border-blue-100 hover:border-blue-200 rounded-2xl px-4 py-2.5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
                          whileHover={{ scale: 1.02, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="text-sm font-medium text-gray-600 group-hover:text-gray-800">
                            Collapse
                          </span>
                          <ChevronUpIcon className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Enhanced Mobile stepper with collapse button */}
                    <div className="sm:hidden">
                      <div className="flex items-center space-x-3 bg-white rounded-xl p-3 shadow-md border border-blue-100 max-w-sm mx-auto">
                        {/* Current step circle */}
                        <motion.div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${
                            steps[currentStep - 1]?.completed
                              ? "bg-blue-600 text-white shadow-blue-200"
                              : "bg-white text-blue-600 border-2 border-blue-600 shadow-blue-100"
                          }`}
                          whileHover={{ scale: 1.05 }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring" }}
                        >
                          {steps[currentStep - 1]?.completed ? (
                            <CheckIcon className="w-5 h-5" />
                          ) : (
                            <span className="font-unbounded">
                              {currentStep}
                            </span>
                          )}
                        </motion.div>

                        {/* Current step info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-lg font-bold font-unbounded text-gray-900 mb-1 truncate">
                            {steps[currentStep - 1]?.name}
                          </p>
                          <div className="relative">
                            <div className="bg-gray-200 rounded-full h-1.5">
                              <motion.div
                                className="bg-gradient-to-r from-blue-600 to-blue-400 h-1.5 rounded-full"
                                initial={{ width: "0%" }}
                                animate={{
                                  width: `${(currentStep / steps.length) * 100}%`,
                                }}
                                transition={{
                                  duration: 0.8,
                                  ease: "easeInOut",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Prominent Collapse Button at Bottom - Mobile */}
                      <div className="flex justify-center mt-4">
                        <motion.button
                          onClick={toggleStepperCollapse}
                          className="group bg-white border-2 border-blue-100 hover:border-blue-200 rounded-2xl px-4 py-2.5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
                          whileHover={{ scale: 1.02, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="text-sm font-medium text-gray-600 group-hover:text-gray-800">
                            Collapse
                          </span>
                          <ChevronUpIcon className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </nav>
            </div>
          </motion.div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-b border-red-200">
              <div className="max-w-7xl mx-auto pr-4 sm:pr-6 lg:pr-8 py-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XMarkIcon className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                      <button
                        onClick={() => setError(null)}
                        className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-4 lg:py-6">
            <div className="max-w-6xl mx-auto">
              {/* Step 1: Enhanced Whitepaper Selection */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="w-full bg-white rounded-xl lg:rounded-2xl shadow-lg overflow-hidden border border-gray-100"
                >
                  {/* Enhanced Step Header */}
                  <div className="bg-white px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-b border-gray-200 relative">
                    {/* Decorative accent bar */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400"></div>

                    <div className="text-center">
                      <motion.h2
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-xl sm:text-2xl lg:text-3xl font-bold font-unbounded text-gray-900 mb-2 sm:mb-3"
                      >
                        Select Your Whitepaper
                      </motion.h2>

                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-sm sm:text-base lg:text-lg text-gray-600 font-archivo max-w-2xl mx-auto"
                      >
                        Choose the whitepaper you'd like to transform into
                        compelling marketing content
                      </motion.p>
                    </div>
                  </div>

                  {/* Enhanced Step Content */}
                  <div className="p-4 sm:p-6 lg:p-8">
                    {/* Integrated Search & Filter Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="mb-6 sm:mb-8 bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200"
                    >
                      <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
                        {/* Search Field */}
                        <div className="flex-1">
                          <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-3 font-archivo">
                            Search Whitepapers
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                              <MagnifyingGlassIcon className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              placeholder="Search by title, filename, or content..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-archivo bg-white shadow-sm"
                            />
                          </div>
                        </div>

                        {/* Filter Dropdown */}
                        <div className="xl:w-64">
                          <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-3 font-archivo">
                            Filter by Bucket
                          </label>
                          <div className="relative">
                            <select
                              value={selectedBucketId}
                              onChange={(e) =>
                                setSelectedBucketId(e.target.value)
                              }
                              className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-archivo bg-white shadow-sm appearance-none"
                            >
                              <option value="">All Buckets</option>
                              {referenceBuckets.map((bucket) => (
                                <option key={bucket.id} value={bucket.id}>
                                  {bucket.name}
                                </option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4 pointer-events-none">
                              <FunnelIcon className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Enhanced Whitepaper List */}
                    {loadingWhitepapers ? (
                      <div className="py-12 sm:py-16">
                        <BrandedLoadingAnimation
                          variant="wave"
                          size="lg"
                          message="Loading your whitepapers..."
                        />
                      </div>
                    ) : filteredWhitepapers.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="text-center py-12 sm:py-16"
                      >
                        <div className="w-16 sm:w-20 lg:w-24 h-16 sm:h-20 lg:h-24 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl sm:rounded-3xl flex items-center justify-center">
                          <DocumentTextIcon className="w-8 sm:w-10 lg:w-12 h-8 sm:h-10 lg:h-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold font-unbounded text-gray-900 mb-2">
                          No whitepapers found
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 font-archivo mb-4 sm:mb-6 max-w-md mx-auto">
                          {searchTerm || selectedBucketId
                            ? "Try adjusting your search criteria or filters"
                            : "Upload your first whitepaper to get started with content generation"}
                        </p>
                        <Link
                          href="/whitepapers"
                          className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold font-archivo hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                        >
                          <DocumentTextIcon className="w-4 sm:w-5 h-4 sm:h-5" />
                          Upload Whitepaper
                        </Link>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto pr-1 sm:pr-2"
                      >
                        {filteredWhitepapers.map(
                          (whitepaper: Whitepaper, index: number) => {
                            // Clean single source of truth for selection state
                            const isSelected = selectedId === whitepaper.id;
                            const isFocused = focusedIndex === index;

                            return (
                              <div
                                key={`whitepaper-${whitepaper.id}`}
                                onClick={() =>
                                  handleWhitepaperSelection(whitepaper)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleWhitepaperSelection(whitepaper);
                                  }
                                }}
                                tabIndex={0}
                                role="button"
                                aria-label={`Select whitepaper: ${whitepaper.title}`}
                                aria-pressed={isSelected}
                                className={`
                                  group relative cursor-pointer transition-all duration-200 ease-out
                                  bg-white rounded-xl shadow-sm border-2 p-5 flex items-center
                                  hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                  ${
                                    isSelected
                                      ? "border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-100/50"
                                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50/50"
                                  }
                                  ${isFocused && !isSelected ? "ring-2 ring-gray-300" : ""}
                                `}
                              >
                                {/* PHASE 2: Single Accent Bar Selection Indicator */}
                                <div
                                  className={`
                                  relative w-1.5 h-20 rounded-full mr-5 flex items-center justify-center
                                  transition-all duration-200 ease-out
                                  ${
                                    isSelected
                                      ? "bg-gradient-to-b from-blue-500 to-blue-600 shadow-md shadow-blue-200"
                                      : "bg-gradient-to-b from-gray-300 to-gray-400 group-hover:from-blue-400 group-hover:to-blue-500"
                                  }
                                `}
                                >
                                  {/* PHASE 2: Clean checkmark indicator */}
                                  <div
                                    className={`
                                    absolute inset-0 flex items-center justify-center
                                    transition-all duration-200 ease-out
                                    ${isSelected ? "opacity-100 scale-100" : "opacity-0 scale-75"}
                                  `}
                                  >
                                    <CheckIcon className="w-3 h-3 text-white drop-shadow-sm" />
                                  </div>
                                </div>

                                {/* Document Thumbnail */}
                                <div className="flex-shrink-0 mr-4">
                                  <div
                                    className={`
                                    w-16 h-20 bg-gray-100 rounded-lg overflow-hidden shadow-sm
                                    transition-all duration-200 ease-out
                                    ${isSelected ? "shadow-md" : ""}
                                  `}
                                  >
                                    <PDFThumbnail
                                      fileUrl={whitepaper.file_url}
                                      width={64}
                                      height={80}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>

                                {/* PHASE 3: Simplified Card Content */}
                                <div className="flex-1 min-w-0">
                                  {/* Title */}
                                  <h3
                                    className={`
                                    text-lg font-bold font-unbounded mb-2 truncate
                                    transition-colors duration-200 ease-out
                                    ${
                                      isSelected
                                        ? "text-blue-900"
                                        : "text-gray-900 group-hover:text-blue-800"
                                    }
                                  `}
                                  >
                                    {whitepaper.title}
                                  </h3>

                                  {/* Metadata */}
                                  <div className="space-y-1.5">
                                    <p className="text-sm text-gray-600 font-archivo truncate">
                                      📄 {whitepaper.filename}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500 font-archivo">
                                      <span className="flex items-center gap-1">
                                        <ClockIcon className="w-3 h-3" />
                                        {formatDate(whitepaper.upload_date)}
                                      </span>
                                      <span>
                                        📊{" "}
                                        {formatFileSize(
                                          whitepaper.file_size_bytes
                                        )}
                                      </span>
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${isSelected ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
                                      >
                                        {whitepaper.chunk_count} chunks
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* PHASE 2: Removed duplicate selection indicator for cleaner design */}
                              </div>
                            );
                          }
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Brief Creation */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full bg-white rounded-xl lg:rounded-2xl shadow-lg overflow-hidden border border-gray-100"
                >
                  {/* Step Header */}
                  <div className="bg-white px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-b border-gray-200 relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400"></div>
                    <div className="text-center">
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-unbounded text-gray-900 mb-2 sm:mb-3">
                        Create Your Marketing Brief
                      </h2>
                      <p className="text-sm sm:text-base lg:text-lg text-gray-600 font-archivo">
                        Tell us about your business and marketing goals
                      </p>
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="p-4 sm:p-6 lg:p-8">
                    <div className="space-y-6">
                      {/* Business Context */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                          What does your business do? *
                          <HelpTooltip
                            content="Describe your company, industry, products/services, and market position. This helps our AI understand your business context for better content generation."
                            position="right"
                          />
                        </label>
                        <textarea
                          rows={4}
                          value={briefData.businessContext}
                          onChange={(e) =>
                            setBriefData({
                              ...briefData,
                              businessContext: e.target.value,
                            })
                          }
                          placeholder="Describe your business, industry, products/services, and market position. For example: 'We are a B2B SaaS company that provides cybersecurity solutions for mid-market financial institutions...'"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>

                      {/* Target Audience */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                          Who is your target audience? *
                          <HelpTooltip
                            content="Define your ideal customer: their role, industry, challenges, and priorities. The more specific you are, the better we can tailor the content."
                            position="right"
                          />
                        </label>
                        <textarea
                          rows={4}
                          value={briefData.targetAudience}
                          onChange={(e) =>
                            setBriefData({
                              ...briefData,
                              targetAudience: e.target.value,
                            })
                          }
                          placeholder="Describe your ideal customer: their role, industry, challenges, and priorities. For example: 'Enterprise IT directors in manufacturing companies...'"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>

                      {/* Marketing Goals */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                          What are your marketing goals? *
                          <HelpTooltip
                            content="Specify what you want to achieve: lead generation, brand awareness, thought leadership, etc. This guides our content strategy and messaging."
                            position="right"
                          />
                        </label>
                        <textarea
                          rows={4}
                          value={briefData.marketingGoals}
                          onChange={(e) =>
                            setBriefData({
                              ...briefData,
                              marketingGoals: e.target.value,
                            })
                          }
                          placeholder="What do you want to achieve? Examples: 'Generate qualified leads for our enterprise sales team', 'Establish thought leadership in the AI space'..."
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>

                      {/* Content Preferences */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-4">
                          Content Output Preferences
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Articles
                            </label>
                            <select
                              value={briefData.articlesCount}
                              onChange={(e) =>
                                setBriefData({
                                  ...briefData,
                                  articlesCount: parseInt(e.target.value),
                                })
                              }
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            >
                              <option value={1}>1 Article</option>
                              <option value={2}>2 Articles</option>
                              <option value={3}>3 Articles</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              LinkedIn Posts
                            </label>
                            <select
                              value={briefData.linkedinPostsCount}
                              onChange={(e) =>
                                setBriefData({
                                  ...briefData,
                                  linkedinPostsCount: parseInt(e.target.value),
                                })
                              }
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            >
                              <option value={2}>2 Posts</option>
                              <option value={4}>4 Posts</option>
                              <option value={6}>6 Posts</option>
                              <option value={8}>8 Posts</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Social Posts
                            </label>
                            <select
                              value={briefData.socialPostsCount}
                              onChange={(e) =>
                                setBriefData({
                                  ...briefData,
                                  socialPostsCount: parseInt(e.target.value),
                                })
                              }
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            >
                              <option value={4}>4 Posts</option>
                              <option value={8}>8 Posts</option>
                              <option value={12}>12 Posts</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Call-to-Action */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-4">
                          Call-to-Action Type
                        </label>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4">
                            <input
                              id="cta-download"
                              name="ctaType"
                              type="radio"
                              value="download_whitepaper"
                              checked={
                                briefData.ctaType === "download_whitepaper"
                              }
                              onChange={(e) =>
                                setBriefData({
                                  ...briefData,
                                  ctaType: e.target.value as
                                    | "download_whitepaper"
                                    | "contact_us",
                                })
                              }
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                            />
                            <label
                              htmlFor="cta-download"
                              className="text-sm text-gray-700"
                            >
                              Download Whitepaper
                            </label>
                          </div>
                          {briefData.ctaType === "download_whitepaper" && (
                            <input
                              type="url"
                              placeholder="Enter whitepaper download URL"
                              value={briefData.ctaUrl || ""}
                              onChange={(e) =>
                                setBriefData({
                                  ...briefData,
                                  ctaUrl: e.target.value,
                                })
                              }
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          )}

                          <div className="flex items-center space-x-4">
                            <input
                              id="cta-contact"
                              name="ctaType"
                              type="radio"
                              value="contact_us"
                              checked={briefData.ctaType === "contact_us"}
                              onChange={(e) =>
                                setBriefData({
                                  ...briefData,
                                  ctaType: e.target.value as
                                    | "download_whitepaper"
                                    | "contact_us",
                                })
                              }
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                            />
                            <label
                              htmlFor="cta-contact"
                              className="text-sm text-gray-700"
                            >
                              Contact Us
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Theme Selection */}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
                >
                  {/* Step Header */}
                  <div className="bg-white px-8 py-8 border-b border-gray-200 relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400"></div>
                    <div className="text-center">
                      <h2 className="text-3xl font-bold font-unbounded text-gray-900 mb-3">
                        Choose Your Content Theme
                      </h2>
                      <p className="text-lg text-gray-600 font-archivo">
                        Select the theme that best aligns with your marketing
                        goals
                      </p>
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="p-8">
                    {loading ? (
                      <div className="py-12">
                        <BrandedLoadingAnimation
                          variant="brain"
                          size="lg"
                          message={
                            themes.length === 0
                              ? "AI agents are analyzing your whitepaper and creating personalized themes..."
                              : "Regenerating themes with fresh insights..."
                          }
                        />
                      </div>
                    ) : themes.length === 0 ? (
                      <div className="text-center py-12">
                        <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                          No themes generated yet
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Click &ldquo;Generate Themes&rdquo; to create
                          personalized content themes
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                          {themes.map((theme) => (
                            <div
                              key={theme.id}
                              onClick={() => setSelectedTheme(theme)}
                              className={`bg-white rounded-lg border-2 p-6 cursor-pointer transition-all hover:shadow-lg flex flex-col relative min-h-[400px] ${
                                selectedTheme?.id === theme.id
                                  ? "border-green-500 bg-green-50"
                                  : "border-gray-200 hover:border-green-300"
                              }`}
                            >
                              {selectedTheme?.id === theme.id && (
                                <div className="absolute top-4 right-4">
                                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                                </div>
                              )}

                              <h3 className="text-xl font-bold text-gray-900 mb-4 pr-8">
                                {theme.title}
                              </h3>
                              <p className="text-gray-600 mb-4 flex-grow">
                                {theme.description}
                              </p>

                              <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">
                                  Why this works:
                                </h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  {theme.whyItWorks.map((point, pointIndex) => (
                                    <li
                                      key={pointIndex}
                                      className="flex items-start"
                                    >
                                      <span className="mr-2 text-green-500">
                                        •
                                      </span>
                                      <span>{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTheme(theme);
                                }}
                                className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors mt-auto ${
                                  selectedTheme?.id === theme.id
                                    ? "bg-green-600 text-white"
                                    : "bg-green-600 text-white hover:bg-green-700"
                                }`}
                              >
                                {selectedTheme?.id === theme.id
                                  ? "Selected"
                                  : "Select This Theme"}
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="text-center">
                          <button
                            onClick={regenerateThemes}
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            <ArrowPathIcon
                              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                            />
                            Generate New Themes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 4: Final Results */}
              {currentStep === 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
                >
                  {/* Step Header */}
                  <div className="bg-white px-8 py-8 border-b border-gray-200 relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-blue-500 to-green-500"></div>
                    <div className="text-center">
                      <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600 mb-3" />
                      <h2 className="text-3xl font-bold font-unbounded text-gray-900 mb-3">
                        Content Generated Successfully!
                      </h2>
                      <p className="text-lg text-gray-600 font-archivo">
                        Your complete content workflow has finished. All content
                        has been generated and edited.
                      </p>
                      {finalResults?.generation_metadata && (
                        <div className="mt-4 text-sm text-gray-500 font-archivo">
                          <p>
                            Generated by{" "}
                            {
                              finalResults.generation_metadata.agents_used
                                .length
                            }{" "}
                            agents in{" "}
                            {Math.round(
                              finalResults.generation_metadata
                                .processing_time_ms / 1000
                            )}
                            s
                          </p>
                          {finalResults.generation_metadata
                            .editing_completed && (
                            <p className="text-green-600 font-medium">
                              ✓ Content has been professionally edited
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="p-8">
                    {finalResults && (
                      <div className="space-y-8">
                        {/* Selected Theme Summary */}
                        {selectedTheme && (
                          <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">
                              Selected Theme
                            </h3>
                            <div className="bg-blue-50 rounded-lg p-4">
                              <h4 className="font-semibold text-blue-900 mb-2">
                                {selectedTheme.title}
                              </h4>
                              <p className="text-blue-800 text-sm">
                                {selectedTheme.description}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Articles */}
                        {finalResults.article && (
                          <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                              📰 Articles
                              {finalResults.edited_content?.article && (
                                <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  Edited (Quality:{" "}
                                  {
                                    finalResults.generation_metadata
                                      ?.content_quality_scores?.article
                                  }
                                  /10)
                                </span>
                              )}
                            </h3>
                            {(
                              finalResults.edited_content?.article?.articles ||
                              finalResults.article.articles
                            )?.map((article: any, index: number) => (
                              <div
                                key={index}
                                className="mb-6 p-4 border border-gray-100 rounded-lg"
                              >
                                <h4 className="text-xl font-bold text-gray-900 mb-2">
                                  {article.headline || article.title}
                                </h4>
                                {article.subheadline && (
                                  <h5 className="text-lg text-gray-700 mb-3">
                                    {article.subheadline}
                                  </h5>
                                )}
                                <div className="prose prose-sm max-w-none text-gray-600 mb-4">
                                  {article.body
                                    ?.split("\n")
                                    .slice(0, 3)
                                    .map(
                                      (paragraph: string, pIndex: number) => (
                                        <p key={pIndex} className="mb-2">
                                          {paragraph}
                                        </p>
                                      )
                                    )}
                                  {article.body?.split("\n").length > 3 && (
                                    <p className="text-gray-500 font-medium">
                                      ... (
                                      {article.wordCount || article.word_count}{" "}
                                      words total)
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                  <span>CTA: {article.call_to_action}</span>
                                  <span>•</span>
                                  <span>Concept: {article.concept_used}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* LinkedIn Posts */}
                        {finalResults.linkedin_posts && (
                          <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                              💼 LinkedIn Posts
                              {finalResults.edited_content?.linkedin_posts && (
                                <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  Edited (Quality:{" "}
                                  {
                                    finalResults.generation_metadata
                                      ?.content_quality_scores?.linkedin
                                  }
                                  /10)
                                </span>
                              )}
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                              {(
                                finalResults.edited_content?.linkedin_posts
                                  ?.posts || finalResults.linkedin_posts.posts
                              )?.map((post: any, index: number) => (
                                <div
                                  key={index}
                                  className="p-4 border border-gray-100 rounded-lg bg-blue-50"
                                >
                                  <div className="text-sm text-gray-900 mb-2">
                                    {post.hook && (
                                      <p className="font-semibold mb-1">
                                        {post.hook}
                                      </p>
                                    )}
                                    <p>{post.body || post.content}</p>
                                  </div>
                                  <div className="text-xs text-blue-700 border-t border-blue-200 pt-2 mt-2">
                                    <p>CTA: {post.call_to_action}</p>
                                    <p>Characters: {post.character_count}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Social Media Posts */}
                        {finalResults.social_posts && (
                          <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                              📱 Social Media Posts
                              {finalResults.edited_content?.social_posts && (
                                <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  Edited (Quality:{" "}
                                  {
                                    finalResults.generation_metadata
                                      ?.content_quality_scores?.social
                                  }
                                  /10)
                                </span>
                              )}
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {(
                                finalResults.edited_content?.social_posts
                                  ?.posts || finalResults.social_posts.posts
                              )?.map((post: any, index: number) => (
                                <div
                                  key={index}
                                  className="p-4 border border-gray-100 rounded-lg"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-white bg-gray-600 px-2 py-1 rounded">
                                      {post.platform?.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {post.character_count} chars
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-900 mb-2">
                                    {post.content}
                                  </p>
                                  {post.visual_suggestion && (
                                    <p className="text-xs text-gray-500 italic">
                                      Visual: {post.visual_suggestion}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Research Summary */}
                        {finalResults.research_dossier && (
                          <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                              🔬 Research Summary
                            </h3>
                            <p className="text-gray-600 mb-4">
                              {finalResults.research_dossier.researchSummary}
                            </p>
                            <div className="text-sm text-gray-500">
                              <p>
                                Key findings:{" "}
                                {finalResults.research_dossier
                                  .whitepaperEvidence?.keyFindings?.length || 0}
                              </p>
                              <p>
                                Whitepaper chunks analyzed:{" "}
                                {finalResults.generation_metadata
                                  ?.whitepaper_chunks_analyzed || 0}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-center mt-8">
                      <div className="space-x-4">
                        <Link href="/dashboard">
                          <ActionButton variant="secondary" size="lg">
                            Back to Dashboard
                          </ActionButton>
                        </Link>
                        <ActionButton
                          variant="accent"
                          size="lg"
                          onClick={() => {
                            setCurrentStep(1);
                            setSelectedId(null); // Reset selectedId
                            setBriefData({
                              businessContext: "",
                              targetAudience: "",
                              marketingGoals: "",
                              articlesCount: 1,
                              linkedinPostsCount: 4,
                              socialPostsCount: 8,
                              ctaType: "contact_us",
                            });
                            setThemes([]);
                            setSelectedTheme(null);
                            setError(null);
                            setWorkflowState(null);
                            setCurrentWorkflowState(null);
                            setFinalResults(null);
                          }}
                          icon={<SparklesIcon className="h-5 w-5" />}
                        >
                          Create Another
                        </ActionButton>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </main>

        {/* Compact Navigation Footer */}
        <div className="bg-white border-t border-gray-200 shadow-sm">
          <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center h-12 sm:h-14 lg:h-16 py-2 sm:py-3">
                {/* Back Button */}
                <div>
                  {currentStep > 1 && currentStep < 4 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBack}
                      disabled={loading}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium font-archivo transition-all duration-200 ${
                        loading
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                      }`}
                    >
                      <ChevronLeftIcon className="w-3 sm:w-4 h-3 sm:h-4" />
                      Back
                    </motion.button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 sm:gap-3">
                  {/* Cancel Button */}
                  <Link href="/dashboard">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white text-gray-700 border border-gray-300 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium font-archivo hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                    >
                      Cancel
                    </motion.button>
                  </Link>

                  {/* Next/Generate Button */}
                  {currentStep < 4 && (
                    <motion.button
                      whileHover={
                        !loading &&
                        !(
                          (currentStep === 1 && !selectedWhitepaper) ||
                          (currentStep === 2 &&
                            (!briefData.businessContext.trim() ||
                              !briefData.targetAudience.trim() ||
                              !briefData.marketingGoals.trim())) ||
                          (currentStep === 3 && !selectedTheme)
                        )
                          ? {
                              scale: 1.02,
                              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
                            }
                          : {}
                      }
                      whileTap={
                        !loading &&
                        !(
                          (currentStep === 1 && !selectedWhitepaper) ||
                          (currentStep === 2 &&
                            (!briefData.businessContext.trim() ||
                              !briefData.targetAudience.trim() ||
                              !briefData.marketingGoals.trim())) ||
                          (currentStep === 3 && !selectedTheme)
                        )
                          ? { scale: 0.98 }
                          : {}
                      }
                      onClick={handleNext}
                      disabled={
                        loading ||
                        (currentStep === 1 && !selectedWhitepaper) ||
                        (currentStep === 2 &&
                          (!briefData.businessContext.trim() ||
                            !briefData.targetAudience.trim() ||
                            !briefData.marketingGoals.trim())) ||
                        (currentStep === 3 && !selectedTheme)
                      }
                      className={`group relative px-4 sm:px-6 py-2 sm:py-2.5 rounded-md sm:rounded-lg text-xs sm:text-sm font-semibold font-archivo transition-all duration-200 flex items-center gap-1.5 sm:gap-2 ${
                        loading ||
                        (currentStep === 1 && !selectedWhitepaper) ||
                        (currentStep === 2 &&
                          (!briefData.businessContext.trim() ||
                            !briefData.targetAudience.trim() ||
                            !briefData.marketingGoals.trim())) ||
                        (currentStep === 3 && !selectedTheme)
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : currentStep === 3
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-500 hover:to-yellow-600 shadow-md"
                            : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md"
                      }`}
                    >
                      {loading ? (
                        <>
                          <div className="w-3 sm:w-4 h-3 sm:h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          {currentStep === 3 ? (
                            <SparklesIcon className="w-3 sm:w-4 h-3 sm:h-4" />
                          ) : (
                            <ChevronRightIcon className="w-3 sm:w-4 h-3 sm:h-4" />
                          )}
                          <span>
                            {currentStep === 3
                              ? "Generate Content"
                              : currentStep === 2
                                ? "Generate Themes"
                                : "Next"}
                          </span>
                        </>
                      )}

                      {/* Tooltip for disabled state */}
                      {currentStep === 1 && !selectedWhitepaper && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 sm:px-3 py-1 sm:py-2 text-xs text-white bg-gray-900 rounded-md sm:rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          Please select a whitepaper first
                        </div>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Mobile Footer - Sticky Bottom */}
              <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-40">
                <div className="flex flex-col gap-3">
                  {currentStep < 4 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNext}
                      disabled={
                        loading ||
                        (currentStep === 1 && !selectedWhitepaper) ||
                        (currentStep === 2 &&
                          (!briefData.businessContext.trim() ||
                            !briefData.targetAudience.trim() ||
                            !briefData.marketingGoals.trim())) ||
                        (currentStep === 3 && !selectedTheme)
                      }
                      className={`w-full py-3 rounded-xl font-bold font-archivo transition-all duration-200 flex items-center justify-center gap-2 ${
                        loading ||
                        (currentStep === 1 && !selectedWhitepaper) ||
                        (currentStep === 2 &&
                          (!briefData.businessContext.trim() ||
                            !briefData.targetAudience.trim() ||
                            !briefData.marketingGoals.trim())) ||
                        (currentStep === 3 && !selectedTheme)
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : currentStep === 3
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900"
                            : "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                      }`}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          {currentStep === 3 ? (
                            <SparklesIcon className="w-5 h-5" />
                          ) : (
                            <ChevronRightIcon className="w-5 h-5" />
                          )}
                          <span>
                            {currentStep === 3
                              ? "Generate Content"
                              : currentStep === 2
                                ? "Generate Themes"
                                : "Next"}
                          </span>
                        </>
                      )}
                    </motion.button>
                  )}

                  <div className="flex gap-3">
                    {currentStep > 1 && currentStep < 4 && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleBack}
                        disabled={loading}
                        className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium font-archivo hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <ChevronLeftIcon className="w-4 h-4" />
                        Back
                      </motion.button>
                    )}

                    <Link href="/dashboard" className="flex-1">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium font-archivo hover:bg-gray-50 transition-all duration-200"
                      >
                        Cancel
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
