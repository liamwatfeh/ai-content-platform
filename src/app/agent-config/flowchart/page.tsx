"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowDownIcon,
  UserIcon,
  CpuChipIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  CheckIcon,
  LightBulbIcon,
  WrenchIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";
import Sidebar from "@/components/Sidebar";

export default function WorkflowFlowchartPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

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
      current: false,
    },
    { name: "History", href: "/history", icon: ClockIcon, current: false },
    {
      name: "(Dev) Agent Config",
      href: "/agent-config",
      icon: WrenchScrewdriverIcon,
      current: true,
    },
    { name: "Settings", href: "/settings", icon: CogIcon, current: false },
  ];

  const workflowSteps = [
    {
      id: "user-input",
      type: "input",
      title: "User Input",
      description: "Business context, target audience, marketing goals",
      icon: UserIcon,
      color: "bg-gray-100 text-gray-800 border-gray-300",
      inputs: [
        "businessContext",
        "targetAudience",
        "marketingGoals",
        "articlesCount",
        "linkedinPostsCount",
        "socialPostsCount",
        "ctaType",
        "ctaUrl",
      ],
      outputs: ["Initial workflow state"],
    },
    {
      id: "agent1",
      type: "agent",
      title: "Agent 1: Brief Creator",
      description:
        "Generates structured marketing brief optimized for LLM consumption",
      model: "o3-2025-04-16",
      icon: CpuChipIcon,
      color: "bg-blue-100 text-blue-800 border-blue-300",
      inputs: [
        "businessContext",
        "targetAudience",
        "marketingGoals",
        "content requirements",
      ],
      outputs: [
        "marketingBrief (JSON string with executiveSummary, targetPersona, campaignObjectives, keyMessages, contentStrategy, callToAction)",
      ],
      tools: ["StructuredOutputParser", "Zod Schema Validation"],
      thinkingProcess: [
        "Analyze raw user input for business context",
        "Transform requirements into structured brief",
        "Generate detailed target persona analysis",
        "Define clear campaign objectives and key messages",
        "Align content strategy with output requirements",
        "Create actionable call-to-action strategy",
      ],
    },
    {
      id: "agent2",
      type: "agent",
      title: "Agent 2: Theme Generator",
      description:
        "Creates 3-5 content themes using intelligent Pinecone search",
      model: "Claude Sonnet 4",
      icon: MagnifyingGlassIcon,
      color: "bg-green-100 text-green-800 border-green-300",
      inputs: [
        "marketingBrief",
        "selectedWhitepaperId",
        "previousThemes",
        "searchHistory",
      ],
      outputs: ["generatedThemes", "themeAnalysis", "recommendedAngles"],
      tools: [
        "Pinecone Vector Search",
        "Think Tool",
        "Iterative Search Parser",
        "StructuredOutputParser",
      ],
      thinkingProcess: [
        "Parse marketing brief and extract key concepts",
        "Generate initial broad search queries (2-3)",
        "Execute iterative Pinecone searches with result analysis",
        "Refine queries based on search effectiveness",
        "Synthesize findings into compelling themes",
        "Ensure themes avoid previous themes and align with persona",
        "Validate theme effectiveness against business objectives",
      ],
    },
    {
      id: "human-selection",
      type: "human",
      title: "Human Selection",
      description: "User selects preferred theme from generated options",
      icon: UserIcon,
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      inputs: ["generatedThemes"],
      outputs: ["selectedTheme"],
      tools: ["UI Theme Selection Interface"],
      thinkingProcess: [
        "Review generated theme options",
        "Evaluate alignment with business goals",
        "Select most compelling theme for content generation",
      ],
    },
    {
      id: "agent3",
      type: "agent",
      title: "Agent 3: Deep Researcher",
      description:
        "Comprehensive research on selected theme using advanced retrieval",
      model: "Claude Sonnet 4",
      icon: MagnifyingGlassIcon,
      color: "bg-purple-100 text-purple-800 border-purple-300",
      inputs: ["selectedTheme", "marketingBrief", "selectedWhitepaperId"],
      outputs: ["researchDossier", "whitepaperEvidence", "suggestedConcepts"],
      tools: [
        "Pinecone Vector Search (3 searches max)",
        "Research Queries Parser",
        "StructuredOutputParser",
      ],
      thinkingProcess: [
        "Generate targeted research queries for theme extraction",
        "Execute strategic Pinecone searches (limit: 3)",
        "Extract quantitative data and case studies",
        "Identify methodologies and implementation frameworks",
        "Analyze barriers and success factors",
        "Compile comprehensive research dossier",
        "Generate content concepts based on evidence",
      ],
    },
    {
      id: "parallel-content",
      type: "parallel",
      title: "Parallel Content Generation Phase",
      description: "Three specialized agents generate content simultaneously",
      agents: [
        {
          id: "agent4a",
          title: "Agent 4a: Article Writer",
          description: "The Economist style authoritative articles",
          model: "Claude Sonnet 4",
          color: "bg-red-100 text-red-800 border-red-300",
          inputs: [
            "marketingBrief",
            "researchDossier",
            "selectedTheme",
            "articlesCount",
          ],
          outputs: ["articles", "metadata", "researchSources"],
          tools: [
            "withStructuredOutput()",
            "Optional Pinecone Search",
            "The Economist Style Guide",
          ],
          thinkingProcess: [
            "Phase 1: Evaluate if additional research needed beyond dossier",
            "Optionally perform targeted Pinecone search for gaps",
            "Phase 2: Generate articles following The Economist style",
            "Apply analytical, authoritative but accessible tone",
            "Use active voice and compelling headlines",
            "Integrate evidence naturally from research dossier",
            "Ensure ~1000 words per article with logical structure",
          ],
        },
        {
          id: "agent4b",
          title: "Agent 4b: LinkedIn Writer",
          description:
            "B2B LinkedIn posts optimized for professional engagement",
          model: "Claude Sonnet 4",
          color: "bg-indigo-100 text-indigo-800 border-indigo-300",
          inputs: [
            "marketingBrief",
            "researchDossier",
            "selectedTheme",
            "linkedinPostsCount",
          ],
          outputs: [
            "linkedinPosts",
            "engagementStrategy",
            "hashtagRecommendations",
          ],
          tools: [
            "withStructuredOutput()",
            "Optional Pinecone Search",
            "B2B Engagement Optimization",
          ],
          thinkingProcess: [
            "Phase 1: Assess need for additional B2B evidence",
            "Optionally search for industry-specific insights",
            "Phase 2: Craft B2B thought leadership content",
            "Optimize for professional network engagement",
            "Include compelling hooks and clear value propositions",
            "Integrate data and insights naturally",
            "Generate strategic hashtag recommendations",
          ],
        },
        {
          id: "agent4c",
          title: "Agent 4c: Social Writer",
          description: "Twitter posts optimized for viral engagement",
          model: "Claude Sonnet 4",
          color: "bg-pink-100 text-pink-800 border-pink-300",
          inputs: [
            "marketingBrief",
            "researchDossier",
            "selectedTheme",
            "socialPostsCount",
          ],
          outputs: ["socialPosts", "viralStrategy", "engagementHooks"],
          tools: [
            "withStructuredOutput()",
            "Optional Pinecone Search",
            "Viral Content Strategy",
          ],
          thinkingProcess: [
            "Phase 1: Determine if additional viral-ready content needed",
            "Optionally search for trending insights or statistics",
            "Phase 2: Create Twitter-optimized viral content",
            "Apply viral content principles and engagement hooks",
            "Optimize for shareability and discussion generation",
            "Balance professional insight with social media appeal",
            "Generate compelling engagement hooks",
          ],
        },
      ],
    },
    {
      id: "parallel-editing",
      type: "parallel",
      title: "Parallel Content Editing Phase",
      description:
        "Three specialized editors enhance content to publication quality",
      agents: [
        {
          id: "agent5a",
          title: "Agent 5a: Article Editor",
          description: "Polishes articles to publication-ready quality",
          model: "Claude Sonnet 4",
          color: "bg-red-200 text-red-900 border-red-400",
          inputs: ["articleOutput", "marketingBrief"],
          outputs: ["editedArticles", "editingSummary", "qualityScore"],
          tools: [
            "withStructuredOutput()",
            "The Economist Editorial Standards",
            "Quality Assessment",
          ],
          thinkingProcess: [
            "Analyze article drafts for structure and flow",
            "Apply The Economist editorial standards",
            "Enhance clarity and analytical depth",
            "Strengthen evidence integration and argumentation",
            "Polish headlines and subheadings for impact",
            "Ensure consistent tone and voice throughout",
            "Generate quality assessment and editing summary",
          ],
        },
        {
          id: "agent5b",
          title: "Agent 5b: LinkedIn Editor",
          description: "Optimizes LinkedIn content for professional engagement",
          model: "Claude Sonnet 4",
          color: "bg-indigo-200 text-indigo-900 border-indigo-400",
          inputs: ["linkedinOutput", "marketingBrief"],
          outputs: [
            "editedLinkedinPosts",
            "engagementOptimizations",
            "professionalToneScore",
          ],
          tools: [
            "withStructuredOutput()",
            "LinkedIn Engagement Analytics",
            "Professional Tone Analysis",
          ],
          thinkingProcess: [
            "Review LinkedIn posts for professional appeal",
            "Optimize hooks for B2B audience engagement",
            "Enhance thought leadership positioning",
            "Refine call-to-actions for professional context",
            "Improve readability and visual formatting",
            "Apply engagement optimization techniques",
            "Score professional tone and authority",
          ],
        },
        {
          id: "agent5c",
          title: "Agent 5c: Social Editor",
          description: "Maximizes social media viral potential",
          model: "Claude Sonnet 4",
          color: "bg-pink-200 text-pink-900 border-pink-400",
          inputs: ["socialOutput", "marketingBrief"],
          outputs: [
            "editedSocialPosts",
            "viralOptimizations",
            "engagementScore",
          ],
          tools: [
            "withStructuredOutput()",
            "Viral Content Analysis",
            "Engagement Prediction",
          ],
          thinkingProcess: [
            "Analyze social posts for viral potential",
            "Enhance engagement hooks and shareability",
            "Optimize timing and conversation starters",
            "Refine balance between insight and accessibility",
            "Improve visual appeal and formatting",
            "Apply viral content optimization techniques",
            "Predict engagement score and reach potential",
          ],
        },
      ],
    },
    {
      id: "final-output",
      type: "output",
      title: "Final Content Package",
      description:
        "Complete content package ready for publication across all channels",
      icon: CheckIcon,
      color: "bg-green-200 text-green-900 border-green-400",
      inputs: ["editedArticles", "editedLinkedinPosts", "editedSocialPosts"],
      outputs: [
        "Publication-ready articles",
        "Professional LinkedIn posts",
        "Viral-optimized social content",
        "Quality scores",
        "Metadata",
      ],
    },
  ];

  const toggleAgentDetails = (agentId: string) => {
    setExpandedAgent(expandedAgent === agentId ? null : agentId);
  };

  const renderAgentCard = (step: any, isSubAgent = false) => {
    const isExpanded = expandedAgent === step.id;
    const cardClass = isSubAgent
      ? "border rounded-lg p-3"
      : "border-2 rounded-lg p-4 max-w-2xl mx-auto";

    return (
      <div
        className={`${cardClass} ${step.color} cursor-pointer transition-all duration-200 ${isExpanded ? "shadow-lg" : ""}`}
        onClick={() => step.type === "agent" && toggleAgentDetails(step.id)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {step.icon && <step.icon className="h-5 w-5 mr-2" />}
            <h3 className={`font-medium ${isSubAgent ? "text-sm" : ""}`}>
              {step.title}
            </h3>
          </div>
          {step.type === "agent" && (
            <LightBulbIcon
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          )}
        </div>

        <p className={`mb-2 ${isSubAgent ? "text-xs" : "text-sm"}`}>
          {step.description}
        </p>

        {step.model && (
          <span
            className={`bg-white bg-opacity-50 px-2 py-1 rounded ${isSubAgent ? "text-xs" : "text-sm"}`}
          >
            {step.model}
          </span>
        )}

        {/* Basic Info */}
        {step.inputs && (
          <div className="mt-2">
            <p className={`font-medium ${isSubAgent ? "text-xs" : "text-sm"}`}>
              Inputs:
            </p>
            <p
              className={`${isSubAgent ? "text-xs" : "text-sm"} text-opacity-80`}
            >
              {step.inputs.slice(0, 2).join(", ")}
              {step.inputs.length > 2 && "..."}
            </p>
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && step.type === "agent" && (
          <div className="mt-4 pt-4 border-t border-white border-opacity-30 space-y-3">
            {/* Full Inputs */}
            {step.inputs && (
              <div>
                <div className="flex items-center mb-1">
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                  <p className="text-sm font-medium">All Inputs:</p>
                </div>
                <ul className="text-xs ml-5 space-y-1">
                  {step.inputs.map((input: string, idx: number) => (
                    <li key={idx} className="list-disc">
                      {input}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Outputs */}
            {step.outputs && (
              <div>
                <div className="flex items-center mb-1">
                  <CheckIcon className="h-4 w-4 mr-1" />
                  <p className="text-sm font-medium">Outputs:</p>
                </div>
                <ul className="text-xs ml-5 space-y-1">
                  {step.outputs.map((output: string, idx: number) => (
                    <li key={idx} className="list-disc">
                      {output}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tools */}
            {step.tools && (
              <div>
                <div className="flex items-center mb-1">
                  <WrenchIcon className="h-4 w-4 mr-1" />
                  <p className="text-sm font-medium">Tools & Capabilities:</p>
                </div>
                <ul className="text-xs ml-5 space-y-1">
                  {step.tools.map((tool: string, idx: number) => (
                    <li key={idx} className="list-disc">
                      {tool}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Thinking Process */}
            {step.thinkingProcess && (
              <div>
                <div className="flex items-center mb-1">
                  <BeakerIcon className="h-4 w-4 mr-1" />
                  <p className="text-sm font-medium">Thinking Process:</p>
                </div>
                <ol className="text-xs ml-5 space-y-1">
                  {step.thinkingProcess.map((thought: string, idx: number) => (
                    <li key={idx} className="list-decimal">
                      {thought}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Header */}
              <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                  <Link
                    href="/agent-config"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back to Agent Config
                  </Link>
                  <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                    Workflow Flowchart
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Interactive visualization of the 9-agent content generation
                    workflow with tools and thinking processes
                  </p>
                  <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
                    💡 Click on any agent to see detailed tools and thinking
                    process
                  </div>
                </div>
              </div>

              {/* Flowchart */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flow-container space-y-6">
                  {workflowSteps.map((step, index) => (
                    <div key={step.id} className="relative">
                      {/* Step Content */}
                      {step.type === "parallel" ? (
                        <div className="space-y-4">
                          <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900">
                              {step.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {step.description}
                            </p>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {step.agents?.map((agent) => (
                              <div key={agent.id}>
                                {renderAgentCard(agent, true)}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        renderAgentCard(step)
                      )}

                      {/* Arrow */}
                      {index < workflowSteps.length - 1 && (
                        <div className="flex justify-center mt-6">
                          <ArrowDownIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Workflow Stats */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="font-medium text-gray-900">Total Agents</h4>
                  <p className="text-2xl font-bold text-blue-600">9</p>
                  <p className="text-xs text-gray-500">AI-powered processing</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="font-medium text-gray-900">
                    Human Touchpoints
                  </h4>
                  <p className="text-2xl font-bold text-green-600">1</p>
                  <p className="text-xs text-gray-500">Theme selection only</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="font-medium text-gray-900">Parallel Stages</h4>
                  <p className="text-2xl font-bold text-purple-600">2</p>
                  <p className="text-xs text-gray-500">Content gen + editing</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="font-medium text-gray-900">Final Outputs</h4>
                  <p className="text-2xl font-bold text-red-600">3</p>
                  <p className="text-xs text-gray-500">
                    Articles, LinkedIn, Social
                  </p>
                </div>
              </div>

              {/* Technical Notes */}
              <div className="mt-8 bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-blue-900 mb-4">
                  Technical Architecture Notes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
                  <div>
                    <h4 className="font-medium mb-2">🔧 Key Technologies:</h4>
                    <ul className="space-y-1 ml-4">
                      <li>
                        • <strong>LangGraph:</strong> Workflow orchestration
                      </li>
                      <li>
                        • <strong>Pinecone:</strong> Vector search (limited to 3
                        searches for agents 2,3,4abc)
                      </li>
                      <li>
                        • <strong>withStructuredOutput():</strong> Guaranteed
                        JSON responses
                      </li>
                      <li>
                        • <strong>Zod:</strong> Schema validation and type
                        safety
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">
                      ⚡ Performance Optimizations:
                    </h4>
                    <ul className="space-y-1 ml-4">
                      <li>
                        • <strong>Parallel Processing:</strong> Agents 4abc and
                        5abc run simultaneously
                      </li>
                      <li>
                        • <strong>Smart Research:</strong> Optional Pinecone
                        calls based on need assessment
                      </li>
                      <li>
                        • <strong>Two-Phase Architecture:</strong> Research
                        decision + content generation
                      </li>
                      <li>
                        • <strong>Structured Parsing:</strong> No retry loops or
                        prompt engineering needed
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
