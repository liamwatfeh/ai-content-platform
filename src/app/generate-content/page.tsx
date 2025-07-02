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

// Types
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

interface BriefData {
  business_context: string;
  target_persona: string;
  marketing_goals: string;
  output_preferences: {
    articles: number;
    linkedin_posts: number;
    social_posts: number;
  };
  cta_type: "download" | "contact";
  cta_url?: string;
  cta_email?: string;
}

interface Theme {
  name: string;
  description: string;
  rationale: string[];
}

interface ReferenceBucket {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export default function GenerateContentPage() {
  const searchParams = useSearchParams();
  const preSelectedWhitepaperID = searchParams.get("whitepaper");

  const [currentStep, setCurrentStep] = useState(1);
  const [whitepapers, setWhitepapers] = useState<Whitepaper[]>([]);
  const [selectedWhitepaper, setSelectedWhitepaper] =
    useState<Whitepaper | null>(null);
  const [briefData, setBriefData] = useState<BriefData>({
    business_context: "",
    target_persona: "",
    marketing_goals: "",
    output_preferences: {
      articles: 1,
      linkedin_posts: 4,
      social_posts: 8,
    },
    cta_type: "download",
  });
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingWhitepapers, setLoadingWhitepapers] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        // Only show completed whitepapers
        const completedWhitepapers = data.whitepapers.filter(
          (wp: Whitepaper) => wp.processing_status === "completed"
        );
        setWhitepapers(completedWhitepapers);

        // Auto-select whitepaper if pre-selected ID is provided
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
      // Validate brief form
      if (
        briefData.business_context.trim() &&
        briefData.target_persona.trim() &&
        briefData.marketing_goals.trim()
      ) {
        generateThemes();
      }
    } else if (currentStep === 3 && selectedTheme) {
      setCurrentStep(4);
      startContentGeneration();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateThemes = async () => {
    setLoading(true);
    setCurrentStep(3);

    // Mock theme generation for now
    setTimeout(() => {
      setThemes([
        {
          name: "Thought Leadership",
          description:
            "Position your company as an industry expert with insightful, educational content that builds trust and authority.",
          rationale: [
            "Builds credibility with technical decision-makers",
            "Creates long-term brand recognition",
            "Generates high-quality leads through expertise demonstration",
          ],
        },
        {
          name: "Problem-Solution Focus",
          description:
            "Highlight specific industry challenges and demonstrate how your solution directly addresses these pain points.",
          rationale: [
            "Resonates with prospects actively seeking solutions",
            "Creates immediate relevance and urgency",
            "Simplifies complex technical concepts for broader appeal",
          ],
        },
        {
          name: "Innovation Showcase",
          description:
            "Emphasize cutting-edge technology and innovative approaches that set your solution apart from competitors.",
          rationale: [
            "Appeals to early adopters and tech-forward organizations",
            "Differentiates from established competitors",
            "Creates excitement around new possibilities",
          ],
        },
      ]);
      setLoading(false);
    }, 2000);
  };

  const regenerateThemes = () => {
    setLoading(true);
    // Mock regeneration - in real app, this would call the API again
    setTimeout(() => {
      setThemes([
        {
          name: "ROI & Business Value",
          description:
            "Focus on quantifiable business benefits, cost savings, and return on investment to appeal to financial decision-makers.",
          rationale: [
            "Speaks directly to budget holders and executives",
            "Provides concrete justification for purchase decisions",
            "Reduces perceived risk through proven value metrics",
          ],
        },
        {
          name: "Customer Success Stories",
          description:
            "Leverage real-world implementations and success stories to build confidence and demonstrate proven results.",
          rationale: [
            "Provides social proof and reduces buyer anxiety",
            "Shows practical applications in similar environments",
            "Builds trust through peer recommendations",
          ],
        },
        {
          name: "Future-Proofing Strategy",
          description:
            "Position your solution as a strategic investment that prepares organizations for future challenges and opportunities.",
          rationale: [
            "Appeals to forward-thinking leadership",
            "Creates urgency around competitive advantage",
            "Justifies investment beyond immediate needs",
          ],
        },
      ]);
      setLoading(false);
    }, 2000);
  };

  const startContentGeneration = () => {
    // This would trigger the actual content generation process
    console.log("Starting content generation with:", {
      whitepaper: selectedWhitepaper,
      brief: briefData,
      theme: selectedTheme,
    });
  };

  // Filter whitepapers based on search term and bucket
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
    { number: 4, name: "Generate Content", completed: false },
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
            {/* Mobile sidebar content */}
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

        {/* Header with border */}
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
                    Choose the whitepaper you'd like to transform into marketing
                    content
                  </p>
                </div>

                {/* Filters */}
                <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search Filter */}
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

                    {/* Bucket Filter */}
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

                  {/* Results Counter */}
                  {!loadingWhitepapers && whitepapers.length > 0 && (
                    <div className="text-sm text-gray-600 mb-4">
                      Showing {filteredWhitepapers.length} of{" "}
                      {whitepapers.length} whitepapers
                      {(searchTerm || selectedBucketId) && (
                        <span className="ml-2">• Filters active</span>
                      )}
                    </div>
                  )}
                </div>

                {loadingWhitepapers ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="ml-3 text-gray-600">
                      Loading whitepapers...
                    </span>
                  </div>
                ) : whitepapers.length === 0 ? (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No whitepapers available
                    </h3>
                    <p className="text-gray-600 mb-6">
                      You need to upload and process whitepapers before
                      generating content.
                    </p>
                    <Link
                      href="/whitepapers"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Go to Whitepapers
                    </Link>
                  </div>
                ) : filteredWhitepapers.length === 0 ? (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No whitepapers match your filters
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Try adjusting your search term or bucket filter to see
                      more results.
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedBucketId("");
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredWhitepapers.map((whitepaper) => (
                      <div
                        key={whitepaper.id}
                        onClick={() => setSelectedWhitepaper(whitepaper)}
                        className={`relative cursor-pointer rounded-lg border-2 p-6 hover:border-green-300 transition-colors ${
                          selectedWhitepaper?.id === whitepaper.id
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        {/* Selection Checkmark */}
                        {selectedWhitepaper?.id === whitepaper.id && (
                          <div className="absolute top-4 right-4">
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
                          </div>
                        )}

                        {/* PDF Thumbnail */}
                        <div className="flex justify-center mb-4">
                          <PDFThumbnail
                            fileUrl={whitepaper.file_url}
                            width={80}
                            height={100}
                          />
                        </div>

                        {/* Whitepaper Info */}
                        <div className="text-center px-2">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 break-words leading-tight">
                            {whitepaper.title}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2 break-all leading-tight">
                            {whitepaper.filename}
                          </p>
                          <div className="text-xs text-gray-400 space-y-1">
                            <div>
                              Uploaded: {formatDate(whitepaper.upload_date)}
                            </div>
                            <div>
                              Size: {formatFileSize(whitepaper.file_size_bytes)}
                            </div>
                            <div>Chunks: {whitepaper.chunk_count}</div>
                          </div>
                        </div>
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
                    Create Your Content Brief
                  </h2>
                  <p className="text-lg text-gray-600">
                    Tell us about your target audience and marketing goals
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Brief Form */}
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="space-y-6">
                        {/* Business Context */}
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Your business context *
                          </label>
                          <textarea
                            rows={4}
                            value={briefData.business_context}
                            onChange={(e) =>
                              setBriefData({
                                ...briefData,
                                business_context: e.target.value,
                              })
                            }
                            placeholder="Provide a detailed description of what your business does, your industry, key products/services, and your market position. For example: 'We are a B2B SaaS company that provides cybersecurity solutions for mid-market financial institutions. Our platform helps banks and credit unions detect and prevent fraud while ensuring regulatory compliance with SOX and PCI-DSS requirements.'"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          />
                        </div>

                        {/* Target Persona */}
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Who is your target audience? *
                          </label>
                          <textarea
                            rows={4}
                            value={briefData.target_persona}
                            onChange={(e) =>
                              setBriefData({
                                ...briefData,
                                target_persona: e.target.value,
                              })
                            }
                            placeholder="Describe your ideal customer: their role, industry, challenges, and priorities. For example: 'Enterprise IT directors in manufacturing companies who are responsible for digital transformation initiatives and are looking to modernize legacy systems while ensuring operational continuity.'"
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
                            value={briefData.marketing_goals}
                            onChange={(e) =>
                              setBriefData({
                                ...briefData,
                                marketing_goals: e.target.value,
                              })
                            }
                            placeholder="What do you want to achieve with this content? Examples: 'Generate qualified leads for our enterprise sales team', 'Establish thought leadership in the AI space', 'Educate prospects about our unique approach to data security', 'Drive whitepaper downloads from technical decision-makers'"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          />
                        </div>

                        {/* Output Preferences */}
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
                                value={briefData.output_preferences.articles}
                                onChange={(e) =>
                                  setBriefData({
                                    ...briefData,
                                    output_preferences: {
                                      ...briefData.output_preferences,
                                      articles: parseInt(e.target.value),
                                    },
                                  })
                                }
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
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
                                value={
                                  briefData.output_preferences.linkedin_posts
                                }
                                onChange={(e) =>
                                  setBriefData({
                                    ...briefData,
                                    output_preferences: {
                                      ...briefData.output_preferences,
                                      linkedin_posts: parseInt(e.target.value),
                                    },
                                  })
                                }
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
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
                                value={
                                  briefData.output_preferences.social_posts
                                }
                                onChange={(e) =>
                                  setBriefData({
                                    ...briefData,
                                    output_preferences: {
                                      ...briefData.output_preferences,
                                      social_posts: parseInt(e.target.value),
                                    },
                                  })
                                }
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500"
                              >
                                <option value={4}>4 Posts</option>
                                <option value={8}>8 Posts</option>
                                <option value={12}>12 Posts</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Call-to-Action Configuration */}
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-4">
                            Call-to-Action Configuration
                          </label>
                          <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                              <input
                                id="cta-download"
                                name="cta_type"
                                type="radio"
                                value="download"
                                checked={briefData.cta_type === "download"}
                                onChange={(e) =>
                                  setBriefData({
                                    ...briefData,
                                    cta_type: e.target.value as
                                      | "download"
                                      | "contact",
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
                            {briefData.cta_type === "download" && (
                              <input
                                type="url"
                                placeholder="Enter whitepaper download URL"
                                value={briefData.cta_url || ""}
                                onChange={(e) =>
                                  setBriefData({
                                    ...briefData,
                                    cta_url: e.target.value,
                                  })
                                }
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            )}

                            <div className="flex items-center space-x-4">
                              <input
                                id="cta-contact"
                                name="cta_type"
                                type="radio"
                                value="contact"
                                checked={briefData.cta_type === "contact"}
                                onChange={(e) =>
                                  setBriefData({
                                    ...briefData,
                                    cta_type: e.target.value as
                                      | "download"
                                      | "contact",
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
                            {briefData.cta_type === "contact" && (
                              <input
                                type="email"
                                placeholder="Enter contact email address"
                                value={briefData.cta_email || ""}
                                onChange={(e) =>
                                  setBriefData({
                                    ...briefData,
                                    cta_email: e.target.value,
                                  })
                                }
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Assistance Panel */}
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        AI Suggestions
                      </h3>
                      <p className="text-sm text-gray-600 mb-6">
                        Based on your selected whitepaper, here are some
                        AI-generated suggestions to help you complete your
                        brief.
                      </p>

                      <div className="space-y-4">
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <h4 className="text-sm font-medium text-purple-900 mb-2">
                            Suggested Business Context
                          </h4>
                          <p className="text-sm text-gray-700 mb-3">
                            A technology company specializing in enterprise
                            software solutions that help businesses modernize
                            their infrastructure while maintaining security and
                            compliance standards across multiple industry
                            verticals.
                          </p>
                          <button
                            onClick={() =>
                              setBriefData({
                                ...briefData,
                                business_context:
                                  "A technology company specializing in enterprise software solutions that help businesses modernize their infrastructure while maintaining security and compliance standards across multiple industry verticals.",
                              })
                            }
                            className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                          >
                            Use Suggestion
                          </button>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-900 mb-2">
                            Suggested Target Persona
                          </h4>
                          <p className="text-sm text-gray-700 mb-3">
                            Technical decision-makers in mid-to-large
                            enterprises who are evaluating solutions for
                            modernizing their infrastructure while maintaining
                            security and compliance requirements.
                          </p>
                          <button
                            onClick={() =>
                              setBriefData({
                                ...briefData,
                                target_persona:
                                  "Technical decision-makers in mid-to-large enterprises who are evaluating solutions for modernizing their infrastructure while maintaining security and compliance requirements.",
                              })
                            }
                            className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Use Suggestion
                          </button>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="text-sm font-medium text-green-900 mb-2">
                            Suggested Marketing Goals
                          </h4>
                          <p className="text-sm text-gray-700 mb-3">
                            Generate qualified leads from enterprises looking to
                            modernize their technology stack while establishing
                            thought leadership in secure, scalable solutions.
                          </p>
                          <button
                            onClick={() =>
                              setBriefData({
                                ...briefData,
                                marketing_goals:
                                  "Generate qualified leads from enterprises looking to modernize their technology stack while establishing thought leadership in secure, scalable solutions.",
                              })
                            }
                            className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Use Suggestion
                          </button>
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
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="ml-3 text-gray-600">
                      Generating themes...
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      {themes.map((theme, index) => (
                        <div
                          key={index}
                          className={`bg-white rounded-lg border-2 p-6 cursor-pointer transition-all hover:shadow-lg flex flex-col relative ${
                            selectedTheme?.name === theme.name
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-green-300"
                          }`}
                        >
                          {/* Check Icon for Selected State */}
                          {selectedTheme?.name === theme.name && (
                            <div className="absolute top-4 right-4">
                              <CheckCircleIcon className="h-6 w-6 text-green-600" />
                            </div>
                          )}

                          <h3 className="text-xl font-bold text-gray-900 mb-4 pr-8">
                            {theme.name}
                          </h3>
                          <p className="text-gray-600 mb-4">
                            {theme.description}
                          </p>
                          <div className="mb-6 flex-grow">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                              Why this works:
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {theme.rationale.map((point, pointIndex) => (
                                <li
                                  key={pointIndex}
                                  className="flex items-start"
                                >
                                  <span className="mr-2">•</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <button
                            onClick={() => setSelectedTheme(theme)}
                            className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors mt-auto ${
                              selectedTheme?.name === theme.name
                                ? "bg-green-600 text-white"
                                : "bg-green-600 text-white hover:bg-green-700"
                            }`}
                          >
                            {selectedTheme?.name === theme.name
                              ? "Selected"
                              : "Select This Theme"}
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="text-center">
                      <button
                        onClick={regenerateThemes}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                        Generate New Themes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Processing Status */}
            {currentStep === 4 && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Generating Your Content
                  </h2>
                  <p className="text-lg text-gray-600">
                    Our AI agents are working on your content. This may take a
                    few minutes.
                  </p>
                </div>

                {/* Progress Steps */}
                <div className="max-w-2xl mx-auto mb-8">
                  <div className="space-y-4">
                    {[
                      { name: "Brief Analysis", status: "completed" },
                      { name: "Theme Research", status: "current" },
                      { name: "Content Drafting", status: "pending" },
                      { name: "Copy Editing", status: "pending" },
                      { name: "Finalization", status: "pending" },
                    ].map((step, index) => (
                      <div key={index} className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            step.status === "completed"
                              ? "bg-green-600 text-white"
                              : step.status === "current"
                                ? "bg-blue-600 text-white animate-pulse"
                                : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          {step.status === "completed" ? (
                            <CheckCircleIcon className="h-5 w-5" />
                          ) : step.status === "current" ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          ) : (
                            index + 1
                          )}
                        </div>
                        <span
                          className={`ml-3 text-sm font-medium ${
                            step.status === "completed" ||
                            step.status === "current"
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                        >
                          {step.name}
                          {step.status === "current" && (
                            <span className="text-blue-600 ml-2">
                              In Progress...
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Current Agent: Research Agent
                  </p>
                  <p className="text-sm text-gray-500">
                    Analyzing whitepaper content and gathering relevant
                    insights...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="bg-white border-t border-gray-200 px-4 py-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            {/* Selected Whitepaper - Compact Display */}
            {selectedWhitepaper && currentStep === 1 && (
              <div className="flex justify-end mb-4">
                <div className="bg-white rounded-lg border-2 border-green-500 p-3 shadow-sm max-w-xs">
                  <div className="flex items-center space-x-3">
                    <PDFThumbnail
                      fileUrl={selectedWhitepaper.file_url}
                      width={40}
                      height={50}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {selectedWhitepaper.title}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        {selectedWhitepaper.filename}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <div>
                {currentStep > 1 && currentStep < 4 && (
                  <button
                    onClick={handleBack}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
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
                      (currentStep === 1 && !selectedWhitepaper) ||
                      (currentStep === 2 &&
                        (!briefData.target_persona.trim() ||
                          !briefData.marketing_goals.trim())) ||
                      (currentStep === 3 && !selectedTheme)
                    }
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentStep === 3 ? "Generate Content" : "Next"}
                    <ChevronRightIcon className="h-4 w-4 ml-2" />
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
