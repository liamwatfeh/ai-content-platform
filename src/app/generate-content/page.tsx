"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XMarkIcon,
  HomeIcon,
  SparklesIcon,
  ClockIcon,
  CogIcon,
  Bars3Icon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import PDFThumbnail from "@/components/PDFThumbnail";

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

  const [currentStep, setCurrentStep] = useState(1);
  const [whitepapers, setWhitepapers] = useState<Whitepaper[]>([]);
  const [selectedWhitepaper, setSelectedWhitepaper] =
    useState<Whitepaper | null>(null);

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
  const [loadingWhitepapers, setLoadingWhitepapers] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(
    null
  );
  const [currentWorkflowState, setCurrentWorkflowState] = useState<{
    marketing_brief?: string;
    generated_themes?: Theme[];
    workflow_state?: WorkflowState;
  } | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBucketId, setSelectedBucketId] = useState<string>("");
  const [referenceBuckets, setReferenceBuckets] = useState<ReferenceBucket[]>(
    []
  );

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon, current: false },
    {
      name: "Whitepapers",
      href: "/whitepapers",
      icon: DocumentTextIcon,
      current: false,
    },
    {
      name: "Generate Content",
      href: "/generate-content",
      icon: SparklesIcon,
      current: true,
    },
    { name: "History", href: "/history", icon: ClockIcon, current: false },
    { name: "Settings", href: "/settings", icon: CogIcon, current: false },
  ];

  useEffect(() => {
    loadWhitepapers();
    loadReferenceBuckets();
  }, []);

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
            setSelectedWhitepaper(preSelected);
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
    setLoading(true);
    setError(null);
    setCurrentStep(3);

    try {
      console.log("🚀 Calling theme generation API...", briefData);

      const response = await fetch("/api/generate-themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(briefData),
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
    if (!currentWorkflowState) {
      setError("No previous workflow state found");
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

  // Handle theme selection
  const handleThemeSelection = async () => {
    if (!selectedTheme || !currentWorkflowState) {
      setError("No theme selected or workflow state missing");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("👤 Selecting theme:", selectedTheme.title);

      const response = await fetch("/api/generate-themes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "select_theme",
          selectedThemeId: selectedTheme.id,
          currentState: {
            ...briefData,
            generatedThemes: themes,
            currentStep: "awaiting_theme_selection",
            needsHumanInput: true,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to select theme");
      }

      if (data.success) {
        setWorkflowState(data.workflow_state);
        setCurrentStep(4);
        console.log(
          "✅ Theme selected successfully:",
          data.selected_theme?.title
        );
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("❌ Theme selection error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to select theme"
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter whitepapers
  const filteredWhitepapers = whitepapers.filter((whitepaper) => {
    const matchesSearch =
      searchTerm === "" ||
      whitepaper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      whitepaper.filename.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBucket =
      selectedBucketId === "" ||
      whitepaper.reference_bucket_id === selectedBucketId;

    return matchesSearch && matchesBucket;
  });

  const steps = [
    { number: 1, name: "Select Whitepaper", completed: currentStep > 1 },
    { number: 2, name: "Create Brief", completed: currentStep > 2 },
    { number: 3, name: "Choose Theme", completed: currentStep > 3 },
    { number: 4, name: "Content Generated", completed: currentStep > 4 },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 flex z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-gray-900">
                  ContentFlow AI
                </h1>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        item.current
                          ? "bg-blue-100 text-blue-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900">
                  ContentFlow AI
                </h1>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        item.current
                          ? "bg-blue-100 text-blue-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-2xl font-bold text-gray-900">
                Generate Content
              </h1>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav aria-label="Progress">
              <ol className="flex items-center justify-center space-x-8">
                {steps.map((step, stepIdx) => (
                  <li key={step.name} className="flex items-center">
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                          step.completed
                            ? "bg-blue-600 text-white"
                            : currentStep === step.number
                              ? "bg-blue-100 text-blue-600 border-2 border-blue-600"
                              : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {step.completed ? (
                          <CheckCircleIcon className="h-6 w-6" />
                        ) : (
                          step.number
                        )}
                      </div>
                      <span
                        className={`ml-3 text-sm font-medium ${
                          step.completed || currentStep === step.number
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {step.name}
                      </span>
                    </div>
                    {stepIdx !== steps.length - 1 && (
                      <ChevronRightIcon className="h-5 w-5 text-gray-300 ml-8" />
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-b border-red-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
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
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Step 1: Whitepaper Selection */}
            {currentStep === 1 && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Select a Whitepaper
                  </h2>
                  <p className="text-lg text-gray-600">
                    Choose the whitepaper you&apos;d like to transform into
                    marketing content
                  </p>
                </div>

                {/* Filters */}
                <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MagnifyingGlassIcon className="h-4 w-4 inline mr-1" />
                        Search Whitepapers
                      </label>
                      <input
                        type="text"
                        placeholder="Search by title or filename..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FunnelIcon className="h-4 w-4 inline mr-1" />
                        Filter by Bucket
                      </label>
                      <select
                        value={selectedBucketId}
                        onChange={(e) => setSelectedBucketId(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">All Buckets</option>
                        {referenceBuckets.map((bucket) => (
                          <option key={bucket.id} value={bucket.id}>
                            {bucket.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Whitepaper Grid */}
                {loadingWhitepapers ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="ml-3 text-gray-600">
                      Loading whitepapers...
                    </span>
                  </div>
                ) : filteredWhitepapers.length === 0 ? (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No whitepapers found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || selectedBucketId
                        ? "Try adjusting your filters"
                        : "Upload a whitepaper to get started"}
                    </p>
                    <div className="mt-6">
                      <Link
                        href="/whitepapers"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        Upload Whitepaper
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredWhitepapers.map((whitepaper) => (
                      <div
                        key={whitepaper.id}
                        onClick={() => setSelectedWhitepaper(whitepaper)}
                        className={`bg-white rounded-lg border-2 p-6 cursor-pointer transition-all hover:shadow-lg ${
                          selectedWhitepaper?.id === whitepaper.id
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-green-300"
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          <PDFThumbnail
                            fileUrl={whitepaper.file_url}
                            width={60}
                            height={80}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              {whitepaper.title}
                            </h3>
                            <p className="text-sm text-gray-500 mb-2">
                              {whitepaper.filename}
                            </p>
                            <div className="text-xs text-gray-400 space-y-1">
                              <div>
                                {formatFileSize(whitepaper.file_size_bytes)}
                              </div>
                              <div>{whitepaper.chunk_count} chunks</div>
                              <div>
                                Uploaded {formatDate(whitepaper.upload_date)}
                              </div>
                            </div>
                          </div>
                        </div>
                        {selectedWhitepaper?.id === whitepaper.id && (
                          <div className="mt-4 flex items-center text-green-600">
                            <CheckCircleIcon className="h-5 w-5 mr-2" />
                            <span className="text-sm font-medium">
                              Selected
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Brief Creation */}
            {currentStep === 2 && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Create Your Marketing Brief
                  </h2>
                  <p className="text-lg text-gray-600">
                    Tell us about your business and marketing goals
                  </p>
                </div>

                <div className="max-w-4xl mx-auto">
                  <div className="bg-white rounded-lg border border-gray-200 p-8">
                    <div className="space-y-6">
                      {/* Business Context */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          What does your business do? *
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
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Who is your target audience? *
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
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          What are your marketing goals? *
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
                </div>
              </div>
            )}

            {/* Step 3: Theme Selection */}
            {currentStep === 3 && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Choose Your Content Theme
                  </h2>
                  <p className="text-lg text-gray-600">
                    Select the theme that best aligns with your marketing goals
                  </p>
                  {workflowState && (
                    <p className="text-sm text-gray-500 mt-2">
                      Generated from whitepaper analysis • Step:{" "}
                      {workflowState.currentStep}
                    </p>
                  )}
                </div>

                {loading ? (
                  <div className="flex flex-col justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
                    <span className="text-gray-600 mb-2">
                      {themes.length === 0
                        ? "Generating themes..."
                        : "Regenerating themes..."}
                    </span>
                    <p className="text-sm text-gray-500">
                      AI agents are analyzing your whitepaper and creating
                      personalized themes
                    </p>
                  </div>
                ) : themes.length === 0 ? (
                  <div className="text-center py-12">
                    <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No themes generated yet
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Click &ldquo;Generate Themes&rdquo; to create personalized
                      content themes
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
                                  <span className="mr-2 text-green-500">•</span>
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
            )}

            {/* Step 4: Success */}
            {currentStep === 4 && (
              <div>
                <div className="text-center mb-8">
                  <CheckCircleIcon className="mx-auto h-16 w-16 text-green-600 mb-4" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Theme Selected Successfully!
                  </h2>
                  <p className="text-lg text-gray-600">
                    Your content theme has been selected and the workflow is
                    complete.
                  </p>
                </div>

                {selectedTheme && (
                  <div className="max-w-2xl mx-auto bg-white rounded-lg border border-gray-200 p-8 mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Selected Theme
                    </h3>
                    <div className="bg-green-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-green-900 mb-2">
                        {selectedTheme.title}
                      </h4>
                      <p className="text-green-800 mb-4">
                        {selectedTheme.description}
                      </p>
                      <div>
                        <h5 className="text-sm font-medium text-green-900 mb-2">
                          Why this works:
                        </h5>
                        <ul className="text-sm text-green-700 space-y-1">
                          {selectedTheme.whyItWorks.map((point, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <div className="space-x-4">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Back to Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setCurrentStep(1);
                        setSelectedWhitepaper(null);
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
                      }}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Create Another
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="bg-white border-t border-gray-200 px-4 py-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between">
              <div>
                {currentStep > 1 && currentStep < 4 && (
                  <button
                    onClick={handleBack}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeftIcon className="h-4 w-4 mr-2" />
                    Back
                  </button>
                )}
              </div>
              <div className="flex space-x-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Link>
                {currentStep < 4 && (
                  <button
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
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Processing...
                      </>
                    ) : currentStep === 3 ? (
                      "Complete"
                    ) : currentStep === 2 ? (
                      "Generate Themes"
                    ) : (
                      "Next"
                    )}
                    {!loading && <ChevronRightIcon className="h-4 w-4 ml-2" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
