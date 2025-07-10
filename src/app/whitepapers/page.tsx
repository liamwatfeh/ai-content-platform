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
import NewBucketModal from "@/components/NewBucketModal";
import Sidebar from "@/components/Sidebar";

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
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [deletingBucketIds, setDeletingBucketIds] = useState<Set<string>>(
    new Set()
  );

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon, current: false },
    {
      name: "Whitepapers",
      href: "/whitepapers",
      icon: DocumentTextIcon,
      current: true,
    },
    {
      name: "Generate Content",
      href: "/generate-content",
      icon: SparklesIcon,
      current: false,
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

  const handleCreateBucket = async (formData: FormData) => {
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

  const handleDeleteBucket = async (bucketId: string, bucketName: string) => {
    setDeletingBucketIds((prev) => new Set([...prev, bucketId]));

    try {
      console.log(`🗑️ Deleting bucket: ${bucketName} (${bucketId})`);

      const response = await fetch(`/api/reference-buckets?id=${bucketId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete bucket");
      }

      console.log(`✅ Bucket deleted successfully: ${bucketName}`);

      // Remove from state
      setBuckets((prev) => prev.filter((bucket) => bucket.id !== bucketId));

      // If the deleted bucket was selected, clear selection
      if (selectedBucket?.id === bucketId) {
        setSelectedBucket(null);
        setWhitepapers([]);
      }

      // Show success message (you could add a toast notification here)
      alert(
        `Bucket "${bucketName}" and its Pinecone index have been successfully deleted.`
      );
    } catch (error) {
      console.error("❌ Error deleting bucket:", error);
      alert(
        `Failed to delete bucket: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setDeletingBucketIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(bucketId);
        return newSet;
      });
    }
  };

  const handleDeleteWhitepapers = async (whitepaperIds: string[]) => {
    try {
      // Track deleting IDs
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        whitepaperIds.forEach((id) => newSet.add(id));
        return newSet;
      });

      console.log(
        "🗑️ [DELETE] Starting deletion for whitepapers:",
        whitepaperIds
      );

      const response = await fetch(
        `/api/whitepapers?ids=${whitepaperIds.join(",")}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        console.log("✅ [DELETE] Deletion completed:", data);

        // Remove deleted whitepapers from the UI
        setWhitepapers((prev) =>
          prev.filter((wp) => !whitepaperIds.includes(wp.id))
        );

        // Show success message
        alert(data.message || "Whitepapers deleted successfully");

        // Refresh the list to ensure consistency
        if (selectedBucket) {
          loadWhitepapers(selectedBucket.id);
        }
      } else {
        console.error("❌ [DELETE] Failed to delete:", data.error);
        alert(data.error || "Failed to delete whitepapers");
      }
    } catch (error) {
      console.error("❌ [DELETE] Error deleting whitepapers:", error);
      alert("Failed to delete whitepapers");
    } finally {
      // Clear deleting IDs
      setDeletingIds((prev) => {
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
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
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
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Buckets</h2>
                  <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    New
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Group your Whitepaper into Indexes
                </p>
              </div>

              {/* Create Bucket Modal */}
              <NewBucketModal
                isOpen={showCreateForm}
                onClose={() => setShowCreateForm(false)}
                onCreateBucket={handleCreateBucket}
                createLoading={createLoading}
              />

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
                        className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors relative ${
                          selectedBucket?.id === bucket.id
                            ? "bg-blue-50 border-2 border-blue-200"
                            : "bg-white border-2 border-transparent hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900 text-sm">
                            {bucket.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            {getBucketStatusBadge(bucket.status)}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  confirm(
                                    `Are you sure you want to delete "${bucket.name}"?\n\nThis will:\n• Delete the Pinecone index: ${bucket.pinecone_index_name}\n• Delete all whitepapers in this bucket\n• Delete all associated content generations\n\nThis action cannot be undone.`
                                  )
                                ) {
                                  handleDeleteBucket(bucket.id, bucket.name);
                                }
                              }}
                              disabled={deletingBucketIds.has(bucket.id)}
                              className="inline-flex items-center p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete bucket"
                            >
                              {deletingBucketIds.has(bucket.id) ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <TrashIcon className="w-4 h-4" />
                              )}
                            </button>
                          </div>
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
                      Choose a bucket from the left panel to view its
                      whitepapers
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
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Are you sure you want to delete "${selectedBucket.name}"?\n\nThis will:\n• Delete the Pinecone index: ${selectedBucket.pinecone_index_name}\n• Delete all whitepapers in this bucket\n• Delete all associated content generations\n\nThis action cannot be undone.`
                              )
                            ) {
                              handleDeleteBucket(
                                selectedBucket.id,
                                selectedBucket.name
                              );
                            }
                          }}
                          disabled={deletingBucketIds.has(selectedBucket.id)}
                          className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingBucketIds.has(selectedBucket.id) ? (
                            <>
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <TrashIcon className="h-4 w-4 mr-2" />
                              Delete Bucket
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setShowUploadZone(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                          Upload Whitepapers
                        </button>
                      </div>
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
                          Upload your first PDF or DOCX whitepaper to get
                          started
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
                                    Uploaded:{" "}
                                    {formatDate(whitepaper.upload_date)}
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
                                        "Are you sure you want to delete this whitepaper? This will permanently remove it from storage, database, and search index."
                                      )
                                    ) {
                                      handleDeleteWhitepapers([whitepaper.id]);
                                    }
                                  }}
                                  disabled={deletingIds.has(whitepaper.id)}
                                  className="inline-flex items-center px-3 py-2 border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm font-medium transition-colors"
                                >
                                  {deletingIds.has(whitepaper.id) ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                                      Deleting...
                                    </>
                                  ) : (
                                    <>
                                      <TrashIcon className="w-4 h-4 mr-1" />
                                      Delete
                                    </>
                                  )}
                                </button>

                                {/* Generate Content Button - Only show when completed */}
                                {whitepaper.processing_status ===
                                  "completed" && (
                                  <Link
                                    href={`/generate-content?whitepaper=${whitepaper.id}`}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium transition-colors"
                                  >
                                    <SparklesIcon className="w-4 h-4 mr-1" />
                                    Generate Content
                                  </Link>
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
                                      {formatFileSize(
                                        whitepaper.file_size_bytes
                                      )}
                                    </div>
                                    {whitepaper.chunk_count > 0 && (
                                      <div>
                                        Chunks: {whitepaper.chunk_count}
                                      </div>
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
                                    <Link
                                      href={`/generate-content?whitepaper=${whitepaper.id}`}
                                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium"
                                    >
                                      <SparklesIcon className="w-4 h-4 mr-1" />
                                      Generate Content
                                    </Link>
                                  )}
                                  {whitepaper.processing_status ===
                                    "failed" && (
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
                                  <button
                                    onClick={() => {
                                      if (
                                        confirm(
                                          "Are you sure you want to delete this whitepaper? This will permanently remove it from storage, database, and search index."
                                        )
                                      ) {
                                        handleDeleteWhitepapers([
                                          whitepaper.id,
                                        ]);
                                      }
                                    }}
                                    disabled={deletingIds.has(whitepaper.id)}
                                    className="w-full inline-flex items-center justify-center px-3 py-2 border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm font-medium"
                                  >
                                    {deletingIds.has(whitepaper.id) ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                                        Deleting...
                                      </>
                                    ) : (
                                      <>
                                        <TrashIcon className="w-4 h-4 mr-1" />
                                        Delete
                                      </>
                                    )}
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
        </main>
      </div>
    </div>
  );
}
