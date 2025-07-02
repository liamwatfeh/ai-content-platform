"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  HomeIcon,
  SparklesIcon,
  DocumentTextIcon,
  ClockIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import PDFThumbnail from "@/components/PDFThumbnail";

// Types
interface ReferenceBucket {
  id: string;
  name: string;
  description: string;
  pinecone_index_name: string;
  status: "creating" | "active" | "failed" | "deleted";
  whitepaper_count: number;
  created_at: string;
  updated_at: string;
}

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

export default function WhitepapersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState<ReferenceBucket | null>(
    null
  );
  const [buckets, setBuckets] = useState<ReferenceBucket[]>([]);
  const [whitepapers, setWhitepapers] = useState<Whitepaper[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon, current: false },
    {
      name: "Generate Content",
      href: "/generate",
      icon: SparklesIcon,
      current: false,
    },
    {
      name: "Whitepapers",
      href: "/whitepapers",
      icon: DocumentTextIcon,
      current: true,
    },
    { name: "History", href: "/history", icon: ClockIcon, current: false },
    { name: "Settings", href: "/settings", icon: CogIcon, current: false },
  ];

  useEffect(() => {
    loadBuckets();
  }, []);

  useEffect(() => {
    if (selectedBucket) {
      loadWhitepapers(selectedBucket.id);
    }
  }, [selectedBucket]);

  // Auto-refresh processing whitepapers every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const hasProcessingWhitepapers = whitepapers.some(
        (wp) =>
          wp.processing_status === "processing" ||
          wp.processing_status === "uploading"
      );

      if (selectedBucket && hasProcessingWhitepapers) {
        loadWhitepapers(selectedBucket.id);
      }
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [selectedBucket, whitepapers]);

  const loadBuckets = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reference-buckets");
      const data = await response.json();

      if (data.success) {
        setBuckets(data.buckets);
        // Auto-select first bucket if available
        if (data.buckets.length > 0 && !selectedBucket) {
          setSelectedBucket(data.buckets[0]);
        }
      } else {
        console.error("Failed to load buckets:", data.error);
      }
    } catch (error) {
      console.error("Error loading buckets:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadWhitepapers = async (bucketId: string) => {
    try {
      const response = await fetch("/api/whitepapers");
      const data = await response.json();

      if (data.success) {
        // Filter whitepapers by bucket ID
        const filteredWhitepapers = data.whitepapers.filter(
          (wp: Whitepaper) => wp.reference_bucket_id === bucketId
        );
        setWhitepapers(filteredWhitepapers);
      } else {
        console.error("Failed to load whitepapers:", data.error);
        setWhitepapers([]);
      }
    } catch (error) {
      console.error("Error loading whitepapers:", error);
      setWhitepapers([]);
    }
  };

  const handleCreateBucket = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    try {
      setCreateLoading(true);
      const response = await fetch("/api/reference-buckets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      });

      const data = await response.json();

      if (data.success) {
        setBuckets((prev) => [data.bucket, ...prev]);
        setSelectedBucket(data.bucket);
        setShowCreateForm(false);
        // Reset form
        event.currentTarget.reset();
      } else {
        console.error("Failed to create bucket:", data.error);
        alert(data.error || "Failed to create bucket");
      }
    } catch (error) {
      console.error("Error creating bucket:", error);
      alert("Failed to create bucket");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!selectedBucket) {
      alert("Please select a reference bucket first");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("bucketId", selectedBucket.id);

      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/whitepapers/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Add new whitepapers to the list
        if (data.uploaded) {
          setWhitepapers((prev) => [...data.uploaded, ...prev]);
        }

        // Refresh bucket count
        await loadBuckets();

        setShowUploadZone(false);

        if (data.errors && data.errors.length > 0) {
          alert(
            `Upload completed with some errors:\n${data.errors.join("\n")}`
          );
        }
      } else {
        console.error("Upload failed:", data.error);
        alert(data.error || "Failed to upload files");
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleRetryProcessing = async (whitepaperIds: string[]) => {
    try {
      // Add IDs to retrying set
      setRetryingIds((prev) => new Set([...prev, ...whitepaperIds]));

      const response = await fetch("/api/whitepapers/retry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ whitepaperIds }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the whitepapers list to show updated status
        if (selectedBucket) {
          await loadWhitepapers(selectedBucket.id);
        }
        alert(
          `Retry processing initiated for ${data.processedCount} whitepaper(s)`
        );
      } else {
        console.error("Failed to retry processing:", data.error);
        alert(data.error || "Failed to retry processing");
      }
    } catch (error) {
      console.error("Error retrying processing:", error);
      alert("Failed to retry processing");
    } finally {
      // Remove IDs from retrying set
      setRetryingIds((prev) => {
        const newSet = new Set(prev);
        whitepaperIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "uploading":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-2"></div>
            Uploading...
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse mr-2"></div>
            Processing...
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Ready
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationCircleIcon className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getBucketStatusBadge = (status: string) => {
    switch (status) {
      case "creating":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-2"></div>
            Creating...
          </span>
        );
      case "active":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationCircleIcon className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading whitepapers...</p>
        </div>
      </div>
    );
  }

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

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Reference Buckets */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Buckets</h2>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  New
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Organize your whitepapers into themed collections
              </p>
            </div>

            {/* Create Bucket Form - Centered Modal */}
            {showCreateForm && (
              <div className="fixed inset-0 bg-gray-900 bg-opacity-20 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                <div className="relative mx-auto p-6 border border-gray-200 w-96 shadow-xl rounded-lg bg-white">
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-black">
                        Create Reference Bucket
                      </h3>
                      <button
                        onClick={() => setShowCreateForm(false)}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateBucket} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-black mb-1">
                          Bucket Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          placeholder="e.g., Financial Reports"
                          required
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-black mb-1">
                          Description
                        </label>
                        <textarea
                          name="description"
                          placeholder="Describe the purpose of this bucket (optional)"
                          rows={3}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                        <p className="text-xs text-blue-800">
                          This will create a new Pinecone index with
                          llama-text-embed-v2 for semantic search.
                        </p>
                      </div>
                      <div className="flex space-x-3 pt-2">
                        <button
                          type="submit"
                          disabled={createLoading}
                          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {createLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Creating...
                            </>
                          ) : (
                            "Create Bucket"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCreateForm(false)}
                          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-black bg-white hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Buckets List */}
            <div className="flex-1 overflow-y-auto">
              {buckets.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    No reference buckets yet
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Create your first bucket to organize your whitepapers
                  </p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Bucket
                  </button>
                </div>
              ) : (
                <div className="p-2">
                  {buckets.map((bucket) => (
                    <div
                      key={bucket.id}
                      onClick={() => setSelectedBucket(bucket)}
                      className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                        selectedBucket?.id === bucket.id
                          ? "bg-blue-50 border-2 border-blue-200"
                          : "bg-white border-2 border-transparent hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900 text-sm">
                          {bucket.name}
                        </h3>
                        {getBucketStatusBadge(bucket.status)}
                      </div>
                      {bucket.description && (
                        <p className="text-xs text-gray-500 mb-2">
                          {bucket.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{bucket.whitepaper_count} whitepapers</span>
                        <span>{formatDate(bucket.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Whitepapers */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!selectedBucket ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a Reference Bucket
                  </h3>
                  <p className="text-sm text-gray-500">
                    Choose a bucket from the left panel to view its whitepapers
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        {selectedBucket.name}
                      </h1>
                      <p className="mt-1 text-sm text-gray-500">
                        {selectedBucket.description || "No description"}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowUploadZone(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                      Upload Whitepapers
                    </button>
                  </div>
                </div>

                {/* Upload Zone Modal */}
                {showUploadZone && (
                  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            Upload Whitepapers
                          </h3>
                          <button
                            onClick={() => setShowUploadZone(false)}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <XMarkIcon className="h-6 w-6" />
                          </button>
                        </div>

                        <div
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
                        >
                          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="mt-4">
                            <label
                              htmlFor="file-upload"
                              className="cursor-pointer"
                            >
                              <span className="mt-2 block text-sm font-medium text-gray-900">
                                Drop files here or click to browse
                              </span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                multiple
                                accept=".pdf,.docx"
                                className="sr-only"
                                onChange={(e) => {
                                  if (e.target.files) {
                                    handleFileUpload(e.target.files);
                                  }
                                }}
                              />
                            </label>
                            <p className="mt-1 text-xs text-gray-500">
                              PDF and DOCX files up to 50MB each
                            </p>
                          </div>
                        </div>

                        {uploading && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-md">
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                              <span className="text-sm text-blue-700">
                                Uploading files...
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Whitepapers List */}
                <div className="flex-1 overflow-y-auto p-6">
                  {whitepapers.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                        <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No whitepapers in this bucket
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Upload your first PDF or DOCX whitepaper to get started
                      </p>
                      <button
                        onClick={() => setShowUploadZone(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                        Upload Whitepaper
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {whitepapers.map((whitepaper) => (
                        <div
                          key={whitepaper.id}
                          className="relative w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 md:min-h-[200px]"
                        >
                          {/* Desktop Layout - Hidden on Mobile */}
                          <div className="hidden md:block">
                            {/* PDF Preview Section - Left Side */}
                            <div className="absolute left-6 top-6">
                              <PDFThumbnail
                                fileUrl={whitepaper.file_url}
                                width={110}
                                height={145}
                                className="lg:w-[120px] lg:h-[160px]"
                              />
                            </div>

                            {/* Status Pill - Top Right Corner */}
                            <div className="absolute top-6 right-6">
                              {getStatusBadge(whitepaper.processing_status)}
                            </div>

                            {/* Main Content Area - Center-Left */}
                            <div className="ml-32 lg:ml-36 mr-16">
                              {/* Title and Filename Section */}
                              <div className="mb-4">
                                <h3 className="text-xl font-semibold text-gray-900 leading-tight mb-1">
                                  {whitepaper.title}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {whitepaper.filename}
                                </p>
                              </div>

                              {/* Metadata Section */}
                              <div className="flex flex-col space-y-2">
                                <div className="text-sm text-gray-600">
                                  Uploaded: {formatDate(whitepaper.upload_date)}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Size:{" "}
                                  {formatFileSize(whitepaper.file_size_bytes)}
                                </div>
                                {whitepaper.chunk_count > 0 && (
                                  <div className="text-sm text-gray-600">
                                    Chunks: {whitepaper.chunk_count}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons - Bottom Right */}
                            <div className="absolute bottom-6 right-6 flex items-center space-x-3">
                              {/* Delete Button */}
                              <button
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Are you sure you want to delete this whitepaper?"
                                    )
                                  ) {
                                    // TODO: Implement delete functionality
                                    console.log(
                                      "Delete whitepaper:",
                                      whitepaper.id
                                    );
                                  }
                                }}
                                className="inline-flex items-center px-3 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-md text-sm font-medium transition-colors"
                              >
                                <TrashIcon className="w-4 h-4 mr-1" />
                                Delete
                              </button>

                              {/* Generate Content Button - Only show when completed */}
                              {whitepaper.processing_status === "completed" && (
                                <button
                                  onClick={() => {
                                    // TODO: Implement generate content functionality
                                    console.log(
                                      "Generate content for:",
                                      whitepaper.id
                                    );
                                  }}
                                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium transition-colors"
                                >
                                  <SparklesIcon className="w-4 h-4 mr-1" />
                                  Generate Content
                                </button>
                              )}

                              {/* Retry Button - Only show when failed */}
                              {whitepaper.processing_status === "failed" && (
                                <button
                                  onClick={() =>
                                    handleRetryProcessing([whitepaper.id])
                                  }
                                  disabled={retryingIds.has(whitepaper.id)}
                                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm font-medium transition-colors"
                                >
                                  {retryingIds.has(whitepaper.id) ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                      Retrying...
                                    </>
                                  ) : (
                                    "Retry"
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Mobile Layout - Only visible on mobile */}
                          <div className="md:hidden">
                            {/* Mobile layout - Stack vertically */}
                            <div className="flex flex-col items-center">
                              {/* PDF Preview - Centered at top, smaller */}
                              <div className="mb-4">
                                <PDFThumbnail
                                  fileUrl={whitepaper.file_url}
                                  width={100}
                                  height={130}
                                />
                              </div>

                              {/* Content - Full width */}
                              <div className="w-full text-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                  {whitepaper.title}
                                </h3>
                                <p className="text-sm text-gray-500 mb-3">
                                  {whitepaper.filename}
                                </p>

                                <div className="space-y-1 text-sm text-gray-600">
                                  <div>
                                    Uploaded:{" "}
                                    {formatDate(whitepaper.upload_date)}
                                  </div>
                                  <div>
                                    Size:{" "}
                                    {formatFileSize(whitepaper.file_size_bytes)}
                                  </div>
                                  {whitepaper.chunk_count > 0 && (
                                    <div>Chunks: {whitepaper.chunk_count}</div>
                                  )}
                                </div>
                              </div>

                              {/* Status - Centered */}
                              <div className="mb-4">
                                {getStatusBadge(whitepaper.processing_status)}
                              </div>

                              {/* Buttons - Full width, stacked */}
                              <div className="w-full space-y-2">
                                {whitepaper.processing_status ===
                                  "completed" && (
                                  <button className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium">
                                    <SparklesIcon className="w-4 h-4 mr-1" />
                                    Generate Content
                                  </button>
                                )}
                                {whitepaper.processing_status === "failed" && (
                                  <button
                                    onClick={() =>
                                      handleRetryProcessing([whitepaper.id])
                                    }
                                    disabled={retryingIds.has(whitepaper.id)}
                                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm font-medium"
                                  >
                                    {retryingIds.has(whitepaper.id) ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                        Retrying...
                                      </>
                                    ) : (
                                      "Retry"
                                    )}
                                  </button>
                                )}
                                <button className="w-full inline-flex items-center justify-center px-3 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-md text-sm font-medium">
                                  <TrashIcon className="w-4 h-4 mr-1" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
