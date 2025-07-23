import Link from "next/link";
import {
  CpuChipIcon,
  DocumentTextIcon,
  KeyIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="font-bold text-xl text-gray-900">ContentFlow AI</div>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors focus-visible:focus"
          >
            Developer Start
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Transform White Papers into Complete Marketing Campaigns
            </h1>
            <p className="text-xl text-gray-600 mt-6 leading-relaxed max-w-3xl mx-auto">
              AI-powered platform that converts your research documents into
              articles, LinkedIn posts, and social media content in minutes.
            </p>
            <div className="mt-8">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl focus-visible:focus"
              >
                Get Started Free
                <ArrowRightIcon className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <CpuChipIcon className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  AI-Powered Content Generation
                </h3>
                <p className="text-gray-600">
                  Advanced AI agents analyze your white papers and generate
                  targeted, high-quality content that resonates with your
                  audience.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <DocumentTextIcon className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Multiple Output Formats
                </h3>
                <p className="text-gray-600">
                  Generate comprehensive content packages including long-form
                  articles, LinkedIn posts, and social media content from a
                  single source.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <KeyIcon className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Your Own API Keys
                </h3>
                <p className="text-gray-600">
                  Use your own OpenAI, Anthropic, and Pinecone API keys. Full
                  control over your data and costs with enterprise-grade
                  security.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Upload White Paper
                </h3>
                <p className="text-gray-600 text-sm">
                  Simply upload your research document or white paper in PDF or
                  DOCX format.
                </p>
              </div>

              {/* Arrow - Hidden on mobile */}
              <div className="hidden lg:flex items-center justify-center">
                <ArrowRightIcon className="w-6 h-6 text-gray-400" />
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Set Parameters
                </h3>
                <p className="text-gray-600 text-sm">
                  Define your target audience, marketing goals, and content
                  preferences.
                </p>
              </div>

              {/* Arrow - Hidden on mobile */}
              <div className="hidden lg:flex items-center justify-center">
                <ArrowRightIcon className="w-6 h-6 text-gray-400" />
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  AI Processing
                </h3>
                <p className="text-gray-600 text-sm">
                  Our AI agents analyze, research, and generate content tailored
                  to your specifications.
                </p>
              </div>

              {/* Arrow - Hidden on mobile */}
              <div className="hidden lg:flex items-center justify-center">
                <ArrowRightIcon className="w-6 h-6 text-gray-400" />
              </div>

              {/* Step 4 */}
              <div className="text-center">
                <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  <CheckCircleIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Download Content
                </h3>
                <p className="text-gray-600 text-sm">
                  Get your complete content package ready for immediate
                  publication across platforms.
                </p>
              </div>
            </div>

            {/* Additional CTA */}
            <div className="text-center mt-12">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors focus-visible:focus"
              >
                Start Your First Campaign
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Perfect for Marketing Teams & Content Creators
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Save Time & Resources
                </h3>
                <p className="text-gray-600">
                  Transform weeks of content creation into minutes. Generate a
                  month's worth of marketing content from a single white paper.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Maintain Quality & Consistency
                </h3>
                <p className="text-gray-600">
                  AI-powered content maintains your brand voice while ensuring
                  professional quality across all platforms and formats.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Target-Specific Content
                </h3>
                <p className="text-gray-600">
                  Generate content tailored to specific personas and markets,
                  perfect for localized campaigns and targeted messaging.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Enterprise Security
                </h3>
                <p className="text-gray-600">
                  Your data stays secure with your own API keys. No content is
                  stored on our servers, ensuring complete privacy and control.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="font-bold text-xl">ContentFlow AI</div>
              <p className="text-gray-400 text-sm mt-1">
                Transform white papers into marketing campaigns
              </p>
            </div>
            <div className="flex space-x-6 text-sm">
              <Link
                href="/privacy"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/contact"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-gray-400 text-sm">
            © 2024 ContentFlow AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
