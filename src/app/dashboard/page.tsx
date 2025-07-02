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
  ChartBarIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";

// Updated interfaces to match new database structure
interface DashboardStats {
  reference_buckets: number;
  whitepapers: number;
  total_chunks: number;
  content_generations: number;
}

interface Whitepaper {
  id: string;
  title: string;
  filename: string;
  processing_status: "uploading" | "processing" | "completed" | "failed";
  chunk_count: number;
  upload_date: string;
}

interface ContentGeneration {
  id: string;
  title: string;
  status: string;
  created_at: string;
  whitepaper_title?: string;
}

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentWhitepapers, setRecentWhitepapers] = useState<Whitepaper[]>([]);
  const [recentGenerations, setRecentGenerations] = useState<
    ContentGeneration[]
  >([]);
  const [loading, setLoading] = useState(true);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon, current: true },
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
      current: false,
    },
    { name: "History", href: "/history", icon: ClockIcon, current: false },
    { name: "Settings", href: "/settings", icon: CogIcon, current: false },
  ];

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load stats
      // TODO: Create dashboard stats API
      const mockStats: DashboardStats = {
        reference_buckets: 0,
        whitepapers: 0,
        total_chunks: 0,
        content_generations: 0,
      };
      setStats(mockStats);

      // Load recent whitepapers
      // TODO: Create recent whitepapers API
      setRecentWhitepapers([]);

      // Load recent content generations
      // TODO: Create recent generations API
      setRecentGenerations([]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  function getStatusStyle(status: string) {
    switch (status) {
      case "uploading":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "uploading":
        return "Uploading...";
      case "processing":
        return "Processing...";
      case "completed":
        return "Ready";
      case "failed":
        return "Failed";
      default:
        return status;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading dashboard...</p>
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

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Welcome Section */}
              <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                    Welcome to ContentFlow AI
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Transform your whitepapers into engaging content across
                    multiple formats
                  </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                  <Link
                    href="/whitepapers"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Upload Whitepaper
                  </Link>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Overview
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Reference Buckets
                            </dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {stats?.reference_buckets || 0}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <DocumentIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Whitepapers
                            </dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {stats?.whitepapers || 0}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <ChartBarIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Total Chunks
                            </dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {stats?.total_chunks || 0}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <SparklesIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Content Generated
                            </dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {stats?.content_generations || 0}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Recent Whitepapers */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Recent Whitepapers
                    </h3>
                    <Link
                      href="/whitepapers"
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="bg-white shadow rounded-lg">
                    {recentWhitepapers.length === 0 ? (
                      <div className="p-8 text-center">
                        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-sm font-medium text-gray-900">
                          No whitepapers yet
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          Upload your first whitepaper to get started.
                        </p>
                        <Link
                          href="/whitepapers"
                          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Upload Whitepaper
                        </Link>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {recentWhitepapers.map((whitepaper) => (
                          <li key={whitepaper.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <DocumentIcon className="h-8 w-8 text-gray-400" />
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">
                                    {whitepaper.title}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {whitepaper.filename} •{" "}
                                    {formatDate(whitepaper.upload_date)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(
                                    whitepaper.processing_status
                                  )}`}
                                >
                                  {getStatusLabel(whitepaper.processing_status)}
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Recent Content Generations */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Recent Content
                    </h3>
                    <Link
                      href="/history"
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="bg-white shadow rounded-lg">
                    {recentGenerations.length === 0 ? (
                      <div className="p-8 text-center">
                        <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-sm font-medium text-gray-900">
                          No content generated yet
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          Generate your first content from a whitepaper.
                        </p>
                        <Link
                          href="/generate"
                          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <SparklesIcon className="h-4 w-4 mr-2" />
                          Generate Content
                        </Link>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {recentGenerations.map((generation) => (
                          <li key={generation.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <SparklesIcon className="h-8 w-8 text-gray-400" />
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">
                                    {generation.title}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {generation.whitepaper_title} •{" "}
                                    {formatDate(generation.created_at)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(
                                    generation.status
                                  )}`}
                                >
                                  {getStatusLabel(generation.status)}
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Link
                    href="/whitepapers"
                    className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 group-hover:bg-blue-100">
                        <DocumentTextIcon className="h-6 w-6" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Upload Whitepaper
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Add a new PDF or DOCX whitepaper to your collection
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/generate"
                    className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 group-hover:bg-green-100">
                        <SparklesIcon className="h-6 w-6" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Generate Content
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Create articles, posts, and social content from your
                        whitepapers
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/settings"
                    className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 group-hover:bg-purple-100">
                        <CogIcon className="h-6 w-6" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Configure API Keys
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Set up your OpenAI, Anthropic, and Pinecone API keys
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
