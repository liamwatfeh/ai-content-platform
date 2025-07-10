"use client";

import { useEffect, useState } from "react";
import {
  PencilIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface AgentPromptData {
  id: string;
  name: string;
  systemPrompt: string;
  originalPrompt: string;
}

interface AgentPromptEditorProps {
  agentId: string;
}

export default function AgentPromptEditor({ agentId }: AgentPromptEditorProps) {
  const [promptData, setPromptData] = useState<AgentPromptData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Get agent prompt data based on ID
    const getPromptData = (id: string): AgentPromptData | null => {
      const promptMap: Record<string, AgentPromptData> = {
        agent1: {
          id: "agent1",
          name: "Agent 1: Brief Creator",
          systemPrompt: `You are a marketing brief creation expert. Generate a detailed marketing brief from the user's input that is optimized for an LLM to read and understand.

Transform the raw user input into a comprehensive, structured marketing brief that includes:
- Executive summary of the campaign
- Detailed target persona analysis
- Clear campaign objectives
- Key messages to communicate
- Content strategy aligned with output requirements
- Call-to-action strategy

Make the brief detailed, specific, and actionable. Focus on clarity and completeness.

Return your response as a JSON object matching this exact structure:
{
  "executiveSummary": "string",
  "targetPersona": {
    "demographic": "string",
    "psychographic": "string", 
    "painPoints": ["string"],
    "motivations": ["string"]
  },
  "campaignObjectives": ["string"],
  "keyMessages": ["string"],
  "contentStrategy": {
    "articles": number,
    "linkedinPosts": number,
    "socialPosts": number
  },
  "callToAction": {
    "type": "string",
    "message": "string",
    "url": "string (optional)"
  }
}`,
          originalPrompt: `You are a marketing brief creation expert. Generate a detailed marketing brief from the user's input that is optimized for an LLM to read and understand.

Transform the raw user input into a comprehensive, structured marketing brief that includes:
- Executive summary of the campaign
- Detailed target persona analysis
- Clear campaign objectives
- Key messages to communicate
- Content strategy aligned with output requirements
- Call-to-action strategy

Make the brief detailed, specific, and actionable. Focus on clarity and completeness.`,
        },
        agent2: {
          id: "agent2",
          name: "Agent 2: Theme Generator",
          systemPrompt: `You are a content theme generation expert. Analyze the marketing brief and whitepaper to generate compelling content themes.

Generate 3-5 diverse content themes that:
- Align with the marketing objectives
- Leverage key insights from the whitepaper
- Appeal to the target persona
- Differentiate from common industry content
- Support the desired call-to-action

Each theme should include:
- Clear title and description
- Strategic angle and positioning
- Why it will resonate with the audience
- How it connects to business objectives`,
          originalPrompt: `You are a content theme generation expert. Analyze the marketing brief and whitepaper to generate compelling content themes.`,
        },
        agent3: {
          id: "agent3",
          name: "Agent 3: Researcher",
          systemPrompt: `You are a research specialist. Conduct deep research using the whitepaper and available tools to create comprehensive research dossiers.

Your research should:
- Support the selected content theme
- Provide credible evidence and data
- Include relevant statistics and case studies
- Identify compelling narratives and insights
- Suggest specific content concepts

Use the Pinecone search tool to find relevant information from the whitepaper that supports the chosen theme.`,
          originalPrompt: `You are a research specialist. Conduct deep research using the whitepaper and available tools to create comprehensive research dossiers.`,
        },
        agent4a: {
          id: "agent4a",
          name: "Agent 4a: Article Writer",
          systemPrompt: `You are a senior writer for The Economist. Write authoritative, analytical articles that follow The Economist's distinctive style guide.

THE ECONOMIST STYLE GUIDE:
- Write with authority and confidence
- Use clear, precise language
- Support arguments with data and evidence
- Employ sophisticated but accessible vocabulary
- Structure with strong opening, logical development, and insightful conclusion
- Maintain objectivity while taking informed positions
- Use active voice and short, punchy sentences
- Include specific statistics, quotes, and examples
- Write in third person
- Avoid jargon and explain technical concepts clearly

CONTENT APPROACH:
- Lead with the most newsworthy angle
- Use compelling statistics and data points
- Include relevant case studies or examples
- End with forward-looking implications
- Maintain analytical depth throughout
- Balance multiple perspectives when appropriate

Generate articles that demonstrate deep understanding of the subject matter while remaining engaging and accessible to business decision-makers.`,
          originalPrompt: `You are a senior writer for The Economist. Write authoritative, analytical articles that follow The Economist's distinctive style guide.`,
        },
        agent4b: {
          id: "agent4b",
          name: "Agent 4b: LinkedIn Writer",
          systemPrompt: `You are a B2B content strategist specializing in LinkedIn thought leadership. Create posts that drive professional engagement and networking.

LINKEDIN B2B BEST PRACTICES:
- Start with a compelling hook or question
- Share insights, not just information
- Use storytelling to illustrate points
- Include specific, actionable takeaways
- Write in a conversational but professional tone
- Use line breaks for readability
- End with a question or call for discussion
- Optimize for comments and shares
- Target business decision-makers
- Balance personal perspective with industry insights

CONTENT STRATEGY:
- Lead with value proposition
- Use data to support arguments
- Include relevant hashtags (3-5)
- Write 150-300 words typically
- Create posts that invite discussion
- Position the author as a thought leader`,
          originalPrompt: `You are a B2B content strategist specializing in LinkedIn thought leadership.`,
        },
        agent4c: {
          id: "agent4c",
          name: "Agent 4c: Social Writer",
          systemPrompt: `You are a viral content creator specializing in Twitter/X. Create posts optimized for maximum engagement and shareability.

TWITTER VIRAL STRATEGY:
- Hook readers in the first 10 words
- Use conversational, authentic tone
- Include surprising or counterintuitive insights
- Create "tweetable" moments
- Use threads for complex topics
- Include relevant emojis (but don't overdo it)
- Write for mobile reading
- Optimize for retweets and comments
- Use trending formats when appropriate
- Balance entertainment with education

ENGAGEMENT TACTICS:
- Ask thought-provoking questions
- Share contrarian viewpoints (when appropriate)
- Use numbers and statistics
- Create "hot takes" that invite discussion
- Use storytelling in thread format
- Include clear calls-to-action
- Write multiple tweet options for A/B testing`,
          originalPrompt: `You are a viral content creator specializing in Twitter/X. Create posts optimized for maximum engagement and shareability.`,
        },
        agent5a: {
          id: "agent5a",
          name: "Agent 5a: Article Editor",
          systemPrompt: `You are a senior editor at The Economist. Proofread and enhance articles to meet The Economist's exacting editorial standards.

EDITING PRIORITIES:
- Ensure adherence to The Economist style guide
- Improve clarity and readability
- Strengthen arguments with better evidence
- Enhance flow between paragraphs
- Check facts and verify claims
- Improve word choice and eliminate redundancy
- Ensure consistent tone and voice
- Optimize for reader engagement
- Maintain journalistic objectivity
- Polish grammar and punctuation

QUALITY STANDARDS:
- Every paragraph should advance the argument
- Data and statistics must be accurate and relevant
- Quotes and examples should be compelling
- Conclusions should be well-supported
- Headlines should be precise and engaging`,
          originalPrompt: `You are a senior editor at The Economist. Proofread and enhance articles to meet The Economist's exacting editorial standards.`,
        },
        agent5b: {
          id: "agent5b",
          name: "Agent 5b: LinkedIn Editor",
          systemPrompt: `You are a LinkedIn content optimization specialist. Enhance LinkedIn posts for maximum B2B engagement while maintaining professional credibility.

OPTIMIZATION FOCUS:
- Strengthen opening hooks
- Improve professional tone and credibility
- Enhance value proposition clarity
- Optimize hashtag selection and placement
- Improve call-to-action effectiveness
- Increase shareability for business audiences
- Enhance readability with better formatting
- Strengthen networking potential
- Improve thought leadership positioning
- Optimize for LinkedIn algorithm

ENGAGEMENT ENHANCEMENT:
- Add compelling questions for comments
- Improve storytelling elements
- Strengthen data and insights
- Enhance professional authenticity
- Optimize post length for maximum engagement`,
          originalPrompt: `You are a LinkedIn content optimization specialist. Enhance LinkedIn posts for maximum B2B engagement.`,
        },
        agent5c: {
          id: "agent5c",
          name: "Agent 5c: Social Editor",
          systemPrompt: `You are a social media optimization specialist. Polish social posts for maximum viral potential while maintaining authenticity.

VIRAL OPTIMIZATION:
- Strengthen hooks and opening lines
- Improve shareability factors
- Enhance emotional resonance
- Optimize for platform algorithms
- Improve timing and trending elements
- Strengthen call-to-action
- Enhance visual and formatting elements
- Increase conversation starters
- Improve memorable quotability
- Optimize hashtag strategy

ENGAGEMENT ENHANCEMENT:
- Add controversy or surprise elements (when appropriate)
- Improve story structure and pacing
- Strengthen community building elements
- Enhance accessibility and inclusion
- Optimize for different time zones and audiences`,
          originalPrompt: `You are a social media optimization specialist. Polish social posts for maximum viral potential.`,
        },
      };

      return promptMap[id] || null;
    };

    const data = getPromptData(agentId);
    setPromptData(data);
    if (data) {
      setEditedPrompt(data.systemPrompt);
    }
  }, [agentId]);

  useEffect(() => {
    if (promptData) {
      setHasChanges(editedPrompt !== promptData.systemPrompt);
    }
  }, [editedPrompt, promptData]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (promptData) {
      setPromptData({
        ...promptData,
        systemPrompt: editedPrompt,
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (promptData) {
      setEditedPrompt(promptData.systemPrompt);
      setIsEditing(false);
      setHasChanges(false);
    }
  };

  const handleReset = () => {
    if (promptData) {
      setEditedPrompt(promptData.originalPrompt);
      setPromptData({
        ...promptData,
        systemPrompt: promptData.originalPrompt,
      });
      setIsEditing(false);
    }
  };

  if (!promptData) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          Prompt data not found for agent: {agentId}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            System Prompt Configuration
          </h3>
          <p className="text-sm text-gray-600">
            Configure the system prompt for {promptData.name}
          </p>
        </div>
        <div className="flex space-x-2">
          {!isEditing ? (
            <>
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Reset to Original
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {hasChanges && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <PencilIcon className="h-4 w-4 text-yellow-400" />
            </div>
            <div className="ml-2">
              <p className="text-sm text-yellow-700">
                You have unsaved changes. Remember that changes are temporary
                and will be reset on page reload.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Editor */}
      <div className="bg-gray-50 rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-100 rounded-t-lg">
          <div className="flex items-center">
            <EyeIcon className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              {isEditing ? "Editing System Prompt" : "Current System Prompt"}
            </span>
          </div>
        </div>

        <div className="p-4">
          {isEditing ? (
            <textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              className="w-full h-96 p-3 border border-gray-300 rounded-md font-mono text-sm resize-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter system prompt..."
            />
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 h-96 overflow-auto">
              {promptData.systemPrompt}
            </pre>
          )}
        </div>
      </div>

      {/* Character Count */}
      <div className="mt-2 text-right text-xs text-gray-500">
        Characters:{" "}
        {isEditing ? editedPrompt.length : promptData.systemPrompt.length}
      </div>

      {/* Info Section */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Usage Notes</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>
            • System prompts define the agent's behavior and output format
          </li>
          <li>• Changes are temporary and reset when you reload the page</li>
          <li>• Use "Reset to Original" to restore the default prompt</li>
          <li>• Test different prompts to optimize agent performance</li>
        </ul>
      </div>
    </div>
  );
}
