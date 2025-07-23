"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  SparklesIcon,
  DocumentTextIcon,
  ClockIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  EllipsisVerticalIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  HomeIcon,
  DocumentIcon,
  CogIcon,
  UserCircleIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import { useSidebar } from "@/contexts/SidebarContext";
import PDFThumbnail from "@/components/PDFThumbnail";
import NewBucketModal from "@/components/NewBucketModal";

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

type ViewMode = "list" | "grid";
type SortOption = "newest" | "oldest" | "name" | "size";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Whitepapers", href: "/whitepapers", icon: DocumentIcon },
  { name: "Generate Content", href: "/generate-content", icon: SparklesIcon },
  { name: "Agent Config", href: "/agent-config", icon: CogIcon },
];

export default function WhitepapersPage() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [selectedBucket, setSelectedBucket] = useState<ReferenceBucket | null>(
    null
  );
  const [buckets, setBuckets] = useState<ReferenceBucket[]>([]);
  const [whitepapers, setWhitepapers] = useState<Whitepaper[]>([]);
  const [filteredWhitepapers, setFilteredWhitepapers] = useState<Whitepaper[]>(
    []
  );
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

  // UI states
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bucketsExpanded, setBucketsExpanded] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    whitepaperIds: string[];
    whitepaperNames: string[];
  }>({
    show: false,
    whitepaperIds: [],
    whitepaperNames: [],
  });
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteBucketModal, setDeleteBucketModal] = useState<{
    show: boolean;
    bucketId: string;
    bucketName: string;
  }>({
    show: false,
    bucketId: "",
    bucketName: "",
  });
  const [deleteBucketConfirmText, setDeleteBucketConfirmText] = useState("");

  useEffect(() => {
    loadBuckets();
  }, []);

  useEffect(() => {
    if (selectedBucket) {
      loadWhitepapers(selectedBucket.id);
    }
  }, [selectedBucket]);

  useEffect(() => {
    let filtered = whitepapers.filter(
      (wp) =>
        wp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wp.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.upload_date).getTime() -
            new Date(a.upload_date).getTime()
          );
        case "oldest":
          return (
            new Date(a.upload_date).getTime() -
            new Date(b.upload_date).getTime()
          );
        case "name":
          return a.title.localeCompare(b.title);
        case "size":
          return b.file_size_bytes - a.file_size_bytes;
        default:
          return 0;
      }
    });

    setFilteredWhitepapers(filtered);
  }, [whitepapers, searchQuery, sortBy]);

  useEffect(() => {
    setShowBulkActions(selectedFiles.size > 0);
  }, [selectedFiles]);

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
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedBucket, whitepapers]);

  const loadBuckets = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reference-buckets");
      const data = await response.json();

      if (data.success) {
        setBuckets(data.buckets);
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

    // Auto-generate Pinecone index name from bucket name
    // Format: contentflow-timestamp-sanitized-name
    // Pinecone requirements: lowercase, alphanumeric + hyphens, max 45 chars
    const pinecone_index_name = `contentbrain-${Date.now()}-${name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-") // Replace non-alphanumeric with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
      .substring(0, 30)}`;

    try {
      setCreateLoading(true);
      const response = await fetch("/api/reference-buckets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, pinecone_index_name }),
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
        if (data.uploaded) {
          setWhitepapers((prev) => [...data.uploaded, ...prev]);
        }
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
      setRetryingIds((prev) => new Set([...prev, ...whitepaperIds]));

      const response = await fetch("/api/whitepapers/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whitepaperIds }),
      });

      const data = await response.json();

      if (data.success) {
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
      setRetryingIds((prev) => {
        const newSet = new Set(prev);
        whitepaperIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    }
  };

  const showDeleteModal = (whitepaperIds: string[]) => {
    const whitepaperNames = whitepapers
      .filter((wp) => whitepaperIds.includes(wp.id))
      .map((wp) => wp.title);

    setDeleteModal({
      show: true,
      whitepaperIds,
      whitepaperNames,
    });
    setDeleteConfirmText("");
  };

  const handleDeleteWhitepapers = async () => {
    if (deleteConfirmText.toLowerCase() !== "delete") {
      return;
    }

    const whitepaperIds = deleteModal.whitepaperIds;

    try {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        whitepaperIds.forEach((id) => newSet.add(id));
        return newSet;
      });

      const response = await fetch(
        `/api/whitepapers?ids=${whitepaperIds.join(",")}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        setWhitepapers((prev) =>
          prev.filter((wp) => !whitepaperIds.includes(wp.id))
        );
        setSelectedFiles(new Set());
        setDeleteModal({ show: false, whitepaperIds: [], whitepaperNames: [] });
        setDeleteConfirmText("");

        if (selectedBucket) {
          loadWhitepapers(selectedBucket.id);
        }
      } else {
        console.error("Failed to delete:", data.error);
        alert(data.error || "Failed to delete whitepapers");
      }
    } catch (error) {
      console.error("Error deleting whitepapers:", error);
      alert("Failed to delete whitepapers");
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        whitepaperIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    }
  };

  const showDeleteBucketModal = (bucketId: string, bucketName: string) => {
    setDeleteBucketModal({
      show: true,
      bucketId,
      bucketName,
    });
    setDeleteBucketConfirmText("");
  };

  const handleDeleteBucket = async () => {
    if (deleteBucketConfirmText.toLowerCase() !== "delete") {
      return;
    }

    const bucketId = deleteBucketModal.bucketId;

    try {
      setDeletingBucketIds((prev) => new Set(prev.add(bucketId)));

      const response = await fetch(`/api/reference-buckets?id=${bucketId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setBuckets((prev) => prev.filter((bucket) => bucket.id !== bucketId));
        if (selectedBucket?.id === bucketId) {
          const remainingBuckets = buckets.filter(
            (bucket) => bucket.id !== bucketId
          );
          setSelectedBucket(
            remainingBuckets.length > 0 ? remainingBuckets[0] : null
          );
        }
        setDeleteBucketModal({ show: false, bucketId: "", bucketName: "" });
        setDeleteBucketConfirmText("");
      } else {
        console.error("Failed to delete bucket:", data.error);
        alert(data.error || "Failed to delete bucket");
      }
    } catch (error) {
      console.error("Error deleting bucket:", error);
      alert("Failed to delete bucket");
    } finally {
      setDeletingBucketIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(bucketId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      uploading: "bg-blue-50 text-blue-700 border-blue-200",
      processing: "bg-amber-50 text-amber-700 border-amber-200",
      completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      failed: "bg-red-50 text-red-700 border-red-200",
    };

    const icons = {
      uploading: (
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      ),
      processing: (
        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
      ),
      completed: <CheckCircleIcon className="w-3 h-3" />,
      failed: <ExclamationCircleIcon className="w-3 h-3" />,
    };

    const labels = {
      uploading: "Uploading",
      processing: "Processing",
      completed: "Ready",
      failed: "Failed",
    };

    return (
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${variants[status as keyof typeof variants] || "bg-gray-50 text-gray-700 border-gray-200"}`}
      >
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels] || status}
      </motion.span>
    );
  };

  const getBucketStatusDot = (status: string) => {
    const colors = {
      creating: "bg-blue-500 animate-pulse",
      active: "bg-emerald-500",
      failed: "bg-red-500",
    };

    return (
      <div
        className={`w-2 h-2 rounded-full ${colors[status as keyof typeof colors] || "bg-gray-400"}`}
      />
    );
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const deselectAllFiles = () => {
    setSelectedFiles(new Set());
  };

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
  }

  // Integrated Sidebar Component
  const IntegratedSidebar = () => (
    <motion.div
      animate={{ width: isCollapsed ? 80 : 320 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex h-full flex-col bg-gradient-to-r from-[#e2fcff] to-white rounded-2xl shadow-lg shadow-blue-100/40 border border-blue-50 m-2 relative"
    >
      {/* Hamburger Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute bg-white rounded-lg p-2 shadow-md border border-blue-100 hover:bg-blue-50 transition-all duration-200 z-10 ${
          isCollapsed
            ? "left-1/2 transform -translate-x-1/2 top-4" // Centered at top when collapsed
            : "right-4 top-4" // Top right when expanded
        }`}
      >
        <Bars3Icon className="h-5 w-5 text-blue-600" />
      </button>

      {/* Logo Section - Only show when expanded */}
      {!isCollapsed && (
        <div className="flex flex-col items-center pt-8 pb-6 px-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-blue-50 rounded-full ring-1 ring-blue-100 shadow-sm mb-4 p-4"
          >
            <Image
              src="/content-brain-logo.svg"
              alt="Content Brain"
              width={48}
              height={48}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <h1 className="text-xl font-bold text-gray-900 font-unbounded">
              Content Brain
            </h1>
            <p className="text-xs text-gray-500 font-archivo mt-1">
              AI Content Platform
            </p>
          </motion.div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className={`space-y-1 ${isCollapsed ? "px-2 pt-16" : "px-4"}`}>
        {" "}
        {/* Add top padding when collapsed */}
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.name} href={item.href} className="relative group">
              <motion.div
                className={classNames(
                  "flex items-center gap-x-3 rounded-xl transition-all duration-200 relative",
                  isCollapsed ? "px-3 py-3 justify-center" : "px-4 py-3",
                  "text-sm font-medium font-archivo",
                  isActive
                    ? "text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/70"
                )}
                whileHover={{ x: isCollapsed ? 0 : 3 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-[#e2fcff] to-blue-50/80 rounded-xl border border-blue-200/60 shadow-md"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <item.icon
                  className={`h-5 w-5 shrink-0 relative z-10 ${isActive ? "text-blue-600" : "text-gray-400"}`}
                />
                {!isCollapsed && (
                  <span
                    className={`relative z-10 ${isActive ? "font-semibold text-blue-800" : ""}`}
                  >
                    {item.name}
                  </span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-6 border-t border-blue-100"></div>

      {/* Reference Buckets Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Buckets Header */}
        <div className={`${isCollapsed ? "px-2" : "px-4"} mb-3`}>
          {!isCollapsed && (
            <button
              onClick={() => setBucketsExpanded(!bucketsExpanded)}
              className="flex items-center justify-between w-full p-2 text-left hover:bg-white/50 rounded-lg transition-colors"
            >
              <h3 className="text-sm font-semibold text-gray-700">
                Whitepaper Buckets
              </h3>
              {bucketsExpanded ? (
                <ChevronUpIcon className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              )}
            </button>
          )}
        </div>

        {/* Buckets List */}
        <AnimatePresence>
          {(bucketsExpanded || isCollapsed) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`flex-1 overflow-y-auto ${isCollapsed ? "px-2" : "px-4"} space-y-2`}
            >
              {buckets.map((bucket, index) => (
                <motion.button
                  key={bucket.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedBucket(bucket)}
                  className={`group w-full text-left p-3 rounded-2xl transition-all duration-200 ${
                    selectedBucket?.id === bucket.id
                      ? "bg-blue-50 border border-blue-200 shadow-sm"
                      : "bg-white/50 border border-transparent hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getBucketStatusDot(bucket.status)}
                      <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                    </div>

                    {!isCollapsed && (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {bucket.name}
                          </p>
                          {bucket.description && (
                            <p className="text-xs text-gray-500 truncate">
                              {bucket.description}
                            </p>
                          )}
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {bucket.whitepaper_count}
                        </span>
                      </>
                    )}
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* New Bucket Button */}
        <div className={`mt-auto ${isCollapsed ? "px-2" : "px-4"} pb-4`}>
          <motion.button
            onClick={() => setShowCreateForm(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neon-yellow text-gray-900 rounded-2xl font-medium text-sm shadow-sm hover:shadow-md transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            {!isCollapsed && "New Bucket"}
          </motion.button>
        </div>
      </div>

      {/* Profile Section */}
      {!isCollapsed && (
        <div className="px-4 py-4 border-t border-blue-100">
          <div className="flex items-center gap-3 p-3 hover:bg-white/70 rounded-xl transition-colors">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-1">
              <UserCircleIcon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">John Doe</p>
              <p className="text-xs text-gray-500">Pro Plan</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
          <p className="text-body text-gray-600">Loading your whitepapers...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Integrated Sidebar */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ${isCollapsed ? "lg:w-20" : "lg:w-80"}`}
      >
        <IntegratedSidebar />
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 ${isCollapsed ? "lg:ml-20" : "lg:ml-80"} transition-all duration-300`}
      >
        {!selectedBucket ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex items-center justify-center h-full"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-50 rounded-3xl flex items-center justify-center"
              >
                <DocumentTextIcon className="h-12 w-12 text-blue-600" />
              </motion.div>
              <h3 className="text-h3 font-headers text-gray-900 mb-2">
                Select a Whitepaper Bucket
              </h3>
              <p className="text-body text-gray-600">
                Choose a bucket from the sidebar to view its whitepapers
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 border-b border-gray-200 bg-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-h2 font-headers text-gray-900">
                    {selectedBucket.name}
                  </h1>
                  <p className="text-body-sm text-gray-500">
                    {selectedBucket.description || "No description"}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                    <span>{selectedBucket.whitepaper_count} files</span>
                    <span>Created {formatDate(selectedBucket.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Destructive Action - Delete Index */}
                  <motion.button
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      showDeleteBucketModal(
                        selectedBucket.id,
                        selectedBucket.name
                      )
                    }
                    disabled={deletingBucketIds.has(selectedBucket.id)}
                    className={`group relative px-4 py-2.5 border-2 border-red-200 text-red-600 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                      deletingBucketIds.has(selectedBucket.id)
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {deletingBucketIds.has(selectedBucket.id) ? (
                      <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                    ) : (
                      <TrashIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
                    )}
                    {deletingBucketIds.has(selectedBucket.id)
                      ? "Deleting..."
                      : "Delete Index"}
                  </motion.button>

                  {/* Primary Action - Upload */}
                  <motion.button
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 8px 25px rgba(59, 130, 246, 0.15)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowUploadZone(true)}
                    className="group px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg"
                  >
                    <CloudArrowUpIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
                    Upload Whitepapers
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Modern Filter Bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 bg-gray-50"
            >
              <div className="bg-white rounded-lg shadow-sm px-4 py-2 flex gap-3 items-center border border-gray-100">
                {/* Search Input */}
                <div className="relative flex-1 min-w-0">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search your whitepapers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-0 bg-transparent placeholder-gray-500 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-md"
                  />
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-200"></div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <label
                    htmlFor="sort-select"
                    className="text-sm font-medium text-gray-700 whitespace-nowrap"
                  >
                    Sort by:
                  </label>
                  <div className="relative">
                    <select
                      id="sort-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="appearance-none bg-white border border-gray-200 rounded-full px-3 py-1.5 pr-8 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="name">Name</option>
                      <option value="size">Size</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-200"></div>

                {/* View Toggle - Segmented Control */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1 flex-shrink-0">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`relative p-2 rounded-md transition-all duration-200 group ${
                      viewMode === "list"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    title="List view"
                  >
                    <ListBulletIcon className="w-4 h-4" />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      List view
                    </div>
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`relative p-2 rounded-md transition-all duration-200 group ${
                      viewMode === "grid"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    title="Grid view"
                  >
                    <Squares2X2Icon className="w-4 h-4" />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      Grid view
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Bulk Actions */}
            <AnimatePresence>
              {showBulkActions && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-blue-50 border-b border-blue-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-body-sm font-medium text-blue-900">
                        {selectedFiles.size} file
                        {selectedFiles.size !== 1 ? "s" : ""} selected
                      </span>
                      <button
                        onClick={deselectAllFiles}
                        className="text-body-sm text-blue-600 hover:text-blue-700"
                      >
                        Clear selection
                      </button>
                    </div>
                    <motion.button
                      whileHover={{
                        scale: 1.02,
                        boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => showDeleteModal([...selectedFiles])}
                      className="group px-4 py-2 border-2 border-red-200 text-red-600 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      <TrashIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
                      Delete Selected
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* File Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredWhitepapers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl flex items-center justify-center"
                  >
                    <DocumentTextIcon className="h-12 w-12 text-gray-400" />
                  </motion.div>
                  <h3 className="text-h3 font-headers text-gray-900 mb-2">
                    No whitepapers yet
                  </h3>
                  <p className="text-body text-gray-600 mb-6">
                    Upload your first PDF or DOCX file to get started
                  </p>
                  <motion.button
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 8px 25px rgba(59, 130, 246, 0.15)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowUploadZone(true)}
                    className="group px-6 py-3 bg-blue-600 text-white rounded-xl font-bold inline-flex items-center gap-2 transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg"
                  >
                    <CloudArrowUpIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
                    Upload Whitepaper
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8"
                      : "space-y-4"
                  }
                >
                  {filteredWhitepapers.map((whitepaper, index) => (
                    <motion.div
                      key={whitepaper.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -2, transition: { duration: 0.2 } }}
                      className="group relative bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-6 min-w-0 overflow-hidden"
                    >
                      <div className="absolute top-4 left-4 z-10">
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(whitepaper.id)}
                          onChange={() => toggleFileSelection(whitepaper.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      <div className="absolute top-4 right-4 z-10">
                        {getStatusBadge(whitepaper.processing_status)}
                      </div>

                      {viewMode === "grid" ? (
                        <div className="flex flex-col items-center text-center pt-8 min-w-0">
                          <div className="mb-4 flex-shrink-0">
                            <PDFThumbnail
                              fileUrl={whitepaper.file_url}
                              width={120}
                              height={160}
                              className="rounded-xl shadow-sm"
                            />
                          </div>
                          <div className="w-full min-w-0 px-2">
                            <h3 className="text-body font-semibold text-gray-900 mb-1 line-clamp-2 break-words">
                              {whitepaper.title}
                            </h3>
                            <p
                              className="text-body-sm text-gray-500 mb-3 truncate w-full"
                              title={whitepaper.filename}
                            >
                              {whitepaper.filename}
                            </p>
                            <div className="flex flex-col gap-1 text-xs text-gray-400 mb-4">
                              <span className="truncate">
                                {formatDate(whitepaper.upload_date)}
                              </span>
                              <span className="truncate">
                                {formatFileSize(whitepaper.file_size_bytes)}
                              </span>
                              {whitepaper.chunk_count > 0 && (
                                <span className="truncate">
                                  {whitepaper.chunk_count} chunks
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-3 w-full min-w-0 px-2">
                            {/* Primary Action - Generate Content */}
                            {whitepaper.processing_status === "completed" && (
                              <motion.div
                                whileHover={{
                                  scale: 1.02,
                                  boxShadow:
                                    "0 8px 25px rgba(59, 130, 246, 0.15)",
                                }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Link
                                  href={`/generate-content?whitepaper=${whitepaper.id}`}
                                  className="group w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 text-white rounded-xl font-bold transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg min-w-0"
                                >
                                  <SparklesIcon className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" />
                                  <span className="truncate">
                                    Generate Content
                                  </span>
                                </Link>
                              </motion.div>
                            )}

                            {/* Retry Action */}
                            {whitepaper.processing_status === "failed" && (
                              <motion.button
                                whileHover={{
                                  scale: 1.02,
                                  boxShadow:
                                    "0 4px 12px rgba(245, 158, 11, 0.15)",
                                }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() =>
                                  handleRetryProcessing([whitepaper.id])
                                }
                                disabled={retryingIds.has(whitepaper.id)}
                                className={`group w-full px-3 py-2.5 border-2 border-amber-200 text-amber-600 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:border-amber-300 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 min-w-0 ${
                                  retryingIds.has(whitepaper.id)
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                              >
                                {retryingIds.has(whitepaper.id) ? (
                                  <div className="w-4 h-4 flex-shrink-0 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin"></div>
                                ) : (
                                  <svg
                                    className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                  </svg>
                                )}
                                <span className="truncate">
                                  {retryingIds.has(whitepaper.id)
                                    ? "Retrying..."
                                    : "Retry Processing"}
                                </span>
                              </motion.button>
                            )}

                            {/* Destructive Action - Delete */}
                            <motion.button
                              whileHover={{
                                scale: 1.02,
                                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
                              }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => showDeleteModal([whitepaper.id])}
                              disabled={deletingIds.has(whitepaper.id)}
                              className={`group w-full px-3 py-2 border-2 border-red-200 text-red-600 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-w-0 ${
                                deletingIds.has(whitepaper.id)
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              {deletingIds.has(whitepaper.id) ? (
                                <div className="w-4 h-4 flex-shrink-0 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                              ) : (
                                <TrashIcon className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" />
                              )}
                              <span className="truncate">
                                {deletingIds.has(whitepaper.id)
                                  ? "Deleting..."
                                  : "Delete"}
                              </span>
                            </motion.button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-6 pl-8">
                          <div className="flex-shrink-0">
                            <PDFThumbnail
                              fileUrl={whitepaper.file_url}
                              width={80}
                              height={106}
                              className="rounded-lg shadow-sm"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-body font-semibold text-gray-900 mb-1 truncate">
                              {whitepaper.title}
                            </h3>
                            <p className="text-body-sm text-gray-500 mb-2 truncate">
                              {whitepaper.filename}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span>{formatDate(whitepaper.upload_date)}</span>
                              <span>
                                {formatFileSize(whitepaper.file_size_bytes)}
                              </span>
                              {whitepaper.chunk_count > 0 && (
                                <span>{whitepaper.chunk_count} chunks</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {/* Primary Action - Generate Content */}
                            {whitepaper.processing_status === "completed" && (
                              <motion.div
                                whileHover={{
                                  scale: 1.02,
                                  boxShadow:
                                    "0 8px 25px rgba(59, 130, 246, 0.15)",
                                }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Link
                                  href={`/generate-content?whitepaper=${whitepaper.id}`}
                                  className="group inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg"
                                >
                                  <SparklesIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                                  Generate Content
                                </Link>
                              </motion.div>
                            )}

                            {/* Retry Action */}
                            {whitepaper.processing_status === "failed" && (
                              <motion.button
                                whileHover={{
                                  scale: 1.02,
                                  boxShadow:
                                    "0 4px 12px rgba(245, 158, 11, 0.15)",
                                }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() =>
                                  handleRetryProcessing([whitepaper.id])
                                }
                                disabled={retryingIds.has(whitepaper.id)}
                                className={`group px-3 py-2 border-2 border-amber-200 text-amber-600 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 hover:border-amber-300 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                                  retryingIds.has(whitepaper.id)
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                              >
                                {retryingIds.has(whitepaper.id) ? (
                                  <div className="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin"></div>
                                ) : (
                                  <svg
                                    className="w-4 h-4 transition-transform group-hover:scale-110"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                  </svg>
                                )}
                                {retryingIds.has(whitepaper.id)
                                  ? "Retrying..."
                                  : "Retry"}
                              </motion.button>
                            )}

                            {/* Destructive Action - Delete (Compact) */}
                            <motion.button
                              whileHover={{
                                scale: 1.02,
                                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
                              }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => showDeleteModal([whitepaper.id])}
                              disabled={deletingIds.has(whitepaper.id)}
                              className={`group p-2.5 border-2 border-red-200 text-red-600 rounded-xl transition-all duration-200 hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                                deletingIds.has(whitepaper.id)
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              title="Delete whitepaper"
                            >
                              {deletingIds.has(whitepaper.id) ? (
                                <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                              ) : (
                                <TrashIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                              )}
                            </motion.button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upload Zone Modal */}
      <AnimatePresence>
        {showUploadZone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowUploadZone(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <h3 className="text-h3 font-headers text-gray-900 mb-2">
                  Upload Whitepapers
                </h3>
                <p className="text-body-sm text-gray-600">
                  Add PDF or DOCX files to your bucket
                </p>
              </div>

              <motion.div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                whileHover={{ scale: 1.02 }}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              >
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-body font-medium text-gray-900">
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
                <p className="text-body-sm text-gray-500 mt-2">
                  PDF and DOCX files up to 50MB each
                </p>
              </motion.div>

              {uploading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-blue-50 rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="loading-spinner h-4 w-4"></div>
                    <span className="text-body-sm text-blue-700">
                      Uploading files...
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Bucket Modal */}
      <NewBucketModal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onCreateBucket={handleCreateBucket}
        createLoading={createLoading}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() =>
              setDeleteModal({
                show: false,
                whitepaperIds: [],
                whitepaperNames: [],
              })
            }
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <TrashIcon className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-h3 font-headers text-gray-900 mb-2">
                  Delete{" "}
                  {deleteModal.whitepaperNames.length === 1
                    ? "Whitepaper"
                    : "Whitepapers"}
                </h3>
                <p className="text-body text-gray-600 mb-4">
                  You are about to delete:
                </p>
                <div className="max-h-32 overflow-y-auto mb-4">
                  {deleteModal.whitepaperNames.map((name, index) => (
                    <p
                      key={index}
                      className="text-body-sm text-gray-800 py-1 px-3 bg-gray-50 rounded-lg mb-2"
                    >
                      {name}
                    </p>
                  ))}
                </div>
                <p className="text-body-sm text-gray-600 mb-6">
                  This action cannot be undone. To confirm, type "delete" below:
                </p>
              </div>

              <div className="mb-6">
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type 'delete' to confirm"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setDeleteModal({
                      show: false,
                      whitepaperIds: [],
                      whitepaperNames: [],
                    })
                  }
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteWhitepapers}
                  disabled={deleteConfirmText.toLowerCase() !== "delete"}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Bucket Confirmation Modal */}
      <AnimatePresence>
        {deleteBucketModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() =>
              setDeleteBucketModal({
                show: false,
                bucketId: "",
                bucketName: "",
              })
            }
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <TrashIcon className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-h3 font-headers text-gray-900 mb-2">
                  Delete Whitepaper Bucket
                </h3>
                <p className="text-body text-gray-600 mb-4">
                  You are about to delete the whitepaper bucket:
                </p>
                <div className="mb-4">
                  <p className="text-body-sm text-gray-800 py-2 px-4 bg-red-50 rounded-lg font-medium">
                    {deleteBucketModal.bucketName}
                  </p>
                </div>
                <p className="text-body-sm text-red-600 font-medium mb-2">
                  ⚠️ This will permanently delete:
                </p>
                <ul className="text-body-sm text-gray-600 mb-6 space-y-1">
                  <li>• All whitepapers in this bucket</li>
                  <li>• All processed content and chunks</li>
                  <li>• The entire Pinecone index</li>
                </ul>
                <p className="text-body-sm text-gray-600 mb-6">
                  This action cannot be undone. To confirm, type "delete" below:
                </p>
              </div>

              <div className="mb-6">
                <input
                  type="text"
                  value={deleteBucketConfirmText}
                  onChange={(e) => setDeleteBucketConfirmText(e.target.value)}
                  placeholder="Type 'delete' to confirm"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setDeleteBucketModal({
                      show: false,
                      bucketId: "",
                      bucketName: "",
                    })
                  }
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteBucket}
                  disabled={deleteBucketConfirmText.toLowerCase() !== "delete"}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete Bucket
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
