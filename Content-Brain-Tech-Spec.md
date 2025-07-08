# AI Content Generation Platform - Technical Specification (MVP)

## Architecture Overview

The platform is a Next.js web application with serverless agent orchestration, where users authenticate, provide their own API keys, and manage multiple white papers in isolated vector database environments. Each user gets their own Pinecone index with separate namespaces for each uploaded white paper.

**Admin Feature**: Includes advanced prompt configuration interface for admin/developer users to test and optimize agent system prompts during development.

## Technology Stack

### Frontend & Backend
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Monaco Editor** for admin prompt editing
- **Vercel** for deployment and hosting
- **Vercel Functions** for serverless API routes and agent orchestration
- **Vercel Blob** for white paper file storage

### Databases & Storage
- **Supabase** (PostgreSQL) for user accounts, API keys, whitepaper metadata, content generation sessions, and admin prompt management
- **Pinecone** vector database with integrated inference models for document storage and semantic search
- **Supabase Auth** for user authentication and session management

### AI Services & Models
- **OpenAI O3 Mini** (`o3-mini`) for Brief Generation Agent
- **GPT-4.1 nano** (`gpt-4.1-nano-2025-04-14`) for contextual chunking
- **Claude Sonnet 4** (`claude-sonnet-4-20250514`) for Theme Generation, Research, Drafting, and Copy Editing agents
- **Claude Think Tool** implementation for enhanced reasoning
- **Pinecone Rerank v0** for result reranking

## Database Schema (Supabase)

### Users Table (Updated)
```sql
users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  pinecone_index_name TEXT UNIQUE, -- user-{userId}
  openai_api_key TEXT ENCRYPTED,
  anthropic_api_key TEXT ENCRYPTED,
  pinecone_api_key TEXT ENCRYPTED,
  api_keys_validated BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'client', -- client, developer, admin
  last_login TIMESTAMP
)
```

### Whitepapers Table
```sql
whitepapers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL, -- Vercel Blob URL
  pinecone_namespace TEXT NOT NULL, -- whitepaper-{whitepaperID}
  upload_date TIMESTAMP DEFAULT NOW(),
  processing_status TEXT DEFAULT 'uploading', -- uploading, processing, completed, failed
  chunk_count INTEGER DEFAULT 0
)
```

### Content Generations Table
```sql
content_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  whitepaper_id UUID REFERENCES whitepapers(id),
  status TEXT DEFAULT 'brief_creation', -- brief_creation, theme_selection, research, drafting, copy_editing, completed
  brief_data JSONB, -- persona, goals, output preferences, CTA config
  generated_themes JSONB, -- array of 3 themes with rationale
  selected_theme JSONB,
  research_data JSONB,
  generated_content JSONB, -- articles, posts, social content
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### Agent Prompts Table (New - Admin Feature)
```sql
agent_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL, -- brief_generation, theme_generation, research, drafting, copy_editing
  prompt_text TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  description TEXT, -- Optional description of what this version changes
  UNIQUE(agent_name, version)
)
```

### Prompt Test Results Table (New - Admin Feature)
```sql
prompt_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES agent_prompts(id),
  test_input JSONB, -- Test data used
  test_output JSONB, -- Agent response
  performance_score DECIMAL(3,2), -- Optional scoring 0-1
  notes TEXT, -- Admin notes about test results
  tested_by UUID REFERENCES users(id),
  tested_at TIMESTAMP DEFAULT NOW()
)
```

## Pinecone Architecture (Updated)

**Key Architecture Decision**: Each user provides their own Pinecone API key and gets **one index per user** with **separate namespaces per whitepaper**. This approach:
- Keeps costs manageable (users pay for their own single index)
- Provides data isolation per user
- Allows multiple whitepapers per user via namespaces
- Maintains security and privacy

**Structure:**
- **User Index**: `user-{userId}` (one per user)
- **Whitepaper Namespaces**: `whitepaper-{whitepaperID}` (multiple per user)
- **Example**: User John has index `user-john123` with namespaces `whitepaper-doc1`, `whitepaper-doc2`, etc.

## User Registration & Onboarding Flow
1. User registers with email/password via Supabase Auth
2. Immediately redirect to API key setup page (no external operations yet)
3. User inputs their OpenAI, Anthropic, and Pinecone API keys
4. Validate API keys by making test calls to each service
5. Upon successful validation, trigger Vercel Function to:
   - Generate unique Pinecone index name (`user-{userId}`)
   - Create Pinecone index using their validated Pinecone API key
   - Store encrypted API keys in Supabase
   - Update user record with index name and set default role as 'client'
6. Mark account as ready for use and redirect to dashboard

### API Key Security & Encryption
- **Encryption Method**: AES-256-GCM encryption for API key storage
- **Key Management**: Each user (including admins) provides and manages their own API keys
- **Admin Testing**: Company API keys used for admin prompt testing and development
- **Decryption**: Keys decrypted server-side only when needed for API calls
- Set initial admin users via environment variable: `INITIAL_ADMIN_EMAILS`
- Admin users get access to `/admin` routes and prompt configuration
- Can promote other users to developer/admin roles

### Admin User Setup
- Set initial admin users via environment variable: `INITIAL_ADMIN_EMAILS`
- Admin users get access to `/admin` routes and prompt configuration
- Can promote other users to developer/admin roles
- **Admin API Keys**: Each admin user provides their own API keys for testing
- **OpenAI**: Test call to models endpoint with O3 and GPT-4.1 nano
- **Anthropic**: Test call to messages endpoint with Claude Sonnet 4
- **Pinecone**: Test call to list indexes and verify user's API key works

### API Key Validation
- **OpenAI**: Test call to models endpoint with O3 Mini and GPT-4.1 nano
- **Anthropic**: Test call to messages endpoint with Claude Sonnet 4
- **Pinecone**: Test call to list indexes and verify user's API key works

### White Paper Upload & Processing
1. User uploads PDF/DOCX white paper via Vercel Blob
2. Generate unique namespace ID (`whitepaper-{whitepaperID}`)
3. Store whitepaper metadata in Supabase
4. Trigger background processing Vercel Function:

### Contextual Chunking Script (GPT-4.1 Nano)
```javascript
// Contextual chunking implementation
async function processWhitepaper(whitepaperId) {
  const whitepaper = await getWhitepaperFromDB(whitepaperId);
  const fileContent = await downloadFromBlob(whitepaper.file_url);
  const documentText = await extractTextFromPDF(fileContent);
  
  // Split into chunks (800 token chunks as recommended)
  const chunks = splitIntoChunks(documentText, 800);
  
  // Generate contextual information for each chunk using GPT-4.1 nano
  const contextualizedChunks = [];
  
  for (const chunk of chunks) {
    const contextPrompt = `<document>
${documentText}
</document>

Here is the chunk we want to situate within the whole document
<chunk>
${chunk}
</chunk>

Please give a short succinct context to situate this chunk within the overall document for the purposes of improving search retrieval of the chunk. Answer only with the succinct context and nothing else.`;

    const context = await callGPT4NanoAPI({
      messages: [{ role: "user", content: contextPrompt }],
      model: "gpt-4.1-nano-2025-04-14"
    });
    
    const contextualizedChunk = context + " " + chunk;
    contextualizedChunks.push({
      id: generateChunkId(),
      text: contextualizedChunk,
      original_text: chunk,
      context: context
    });
  }
  
  // Upsert to Pinecone with integrated embedding
  await upsertToPinecone(
    whitepaper.user.pinecone_index_name,
    whitepaper.pinecone_namespace,
    contextualizedChunks
  );
  
  // Update processing status
  await updateWhitepaperStatus(whitepaperId, 'completed', contextualizedChunks.length);
}
```

## Agent Implementation

### Agent Architecture Pattern
Each agent follows this structure:
- Uses user's API keys from Supabase
- Implements Claude Think Tool for enhanced reasoning
- Uses configurable system prompts (admin feature)
- Has access to Pinecone for document retrieval (except Brief Generation)
- Updates workflow state in Supabase

### Prompt Management System (Admin Feature)
```javascript
// Get active system prompt for an agent
async function getAgentPrompt(agentName) {
  const prompt = await supabase
    .from('agent_prompts')
    .select('prompt_text')
    .eq('agent_name', agentName)
    .eq('is_active', true)
    .single();
    
  if (!prompt.data) {
    // Fall back to default prompt
    const defaultPrompt = await supabase
      .from('agent_prompts')
      .select('prompt_text')
      .eq('agent_name', agentName)
      .eq('is_default', true)
      .single();
    return defaultPrompt.data?.prompt_text || getHardcodedDefault(agentName);
  }
  
  return prompt.data.prompt_text;
}

// Default prompts for each agent
const DEFAULT_PROMPTS = {
  brief_generation: `Based on this white paper content, generate a comprehensive marketing brief including:
1. Target persona characteristics and priorities
2. Marketing goals and objectives
3. Key value propositions
4. Recommended content themes

Analyze the content thoroughly and provide specific, actionable insights.`,

  theme_generation: `You are a content strategist generating marketing themes based on white papers.

Use the "think" tool to:
- Analyze the brief requirements and persona
- Review relevant white paper content
- Consider different thematic approaches
- Evaluate which themes would best resonate with the target audience

Generate exactly 3 distinct content themes, each with:
- Theme name and core concept
- Detailed rationale for why this appeals to the persona
- Key messaging angles
- Content approach strategy`,

  research: `You are a research analyst compiling comprehensive research for content creation.

Use the "think" tool to:
- Analyze all research findings
- Identify key data points and supporting evidence
- Organize information by relevance to the theme
- Note any gaps or additional research needed
- Synthesize findings into actionable insights

Compile a detailed research document with key findings, data points, and content recommendations.`,

  drafting: `You are a content creator generating marketing materials.

Use the "think" tool to:
- Plan content structure and flow
- Ensure consistency across all content pieces
- Adapt tone and style for each content type
- Integrate CTAs appropriately
- Review content for persona alignment

Generate:
- 1 long-form article (800-1500 words)
- 4 LinkedIn posts (150-300 words each)
- 8 social media posts (30-50 words each)

All content should include the specified CTA and maintain thematic consistency.`,

  copy_editing: `You are a professional copy editor applying The Economist style guide.

Use the "think" tool to:
- Review each piece for clarity and consistency
- Check adherence to style guide requirements
- Optimize content for respective platforms
- Ensure CTA integration is natural
- Verify all content meets quality standards

Apply The Economist style guide principles:
- Clear, concise writing
- Active voice preference
- Consistent terminology
- Professional tone
- Proper formatting for each platform`
};
```

### Claude Think Tool Implementation
```javascript
const THINK_TOOL = {
  name: "think",
  description: "Use the tool to think about something. It will not obtain new information or change the database, but just append the thought to the log. Use it when complex reasoning or some cache memory is needed.",
  input_schema: {
    type: "object",
    properties: {
      thought: {
        type: "string",
        description: "A thought to think about."
      }
    },
    required: ["thought"]
  }
};

// Function to call Claude with Think tool and configurable prompt
async function callClaudeWithThink(userApiKey, messages, agentName, additionalTools = []) {
  const systemPrompt = await getAgentPrompt(agentName);
  const tools = [THINK_TOOL, ...additionalTools];
  
  console.log(`Calling Claude Sonnet 4 for ${agentName}`);
  return await callClaudeAPI({
    model: "claude-sonnet-4-20250514",
    messages: messages,
    system: systemPrompt,
    tools: tools,
    max_tokens: 4000
  }, userApiKey);
}
```

### Pinecone Integration for Agents
```javascript
async function searchPinecone(userPineconeKey, indexName, namespace, query, topK = 20) {
  // Search with integrated embedding
  const searchResults = await pineconeSearch({
    query: {
      inputs: { text: query },
      top_k: topK
    },
    namespace: namespace,
    rerank: {
      model: "pinecone-rerank-v0",
      top_n: 10,
      rank_fields: ["text"]
    }
  }, userPineconeKey, indexName);
  
  return searchResults.result.hits;
}
```

### Updated Agent Implementations

### Agent 1: Brief Generation (OpenAI O3 Mini)
```javascript
async function briefGenerationAgent(contentGenerationId) {
  const context = { operation: 'brief_generation', contentGenerationId };
  
  return await withErrorHandling(async () => {
    const generation = await getContentGeneration(contentGenerationId);
    const user = await getUser(generation.user_id);
    
    const systemPrompt = await getAgentPrompt('brief_generation');
    
    const briefPrompt = `${systemPrompt}

White paper: [content here]
User inputs: ${JSON.stringify(generation.brief_data)}`;

    console.log('Calling OpenAI O3 Mini for brief generation');
    const response = await callOpenAIO3({
      messages: [{ role: "user", content: briefPrompt }],
      model: "o3-mini"
    }, user.openai_api_key);
    
    // Parse and store brief data
    const parsedBrief = JSON.parse(response.content);
    await updateContentGeneration(contentGenerationId, {
      brief_data: parsedBrief,
      status: 'theme_selection'
    });
    
    return parsedBrief;
  }, context);
}
```

### Agent 2: Theme Generation (Claude Sonnet 4 + Think Tool)
```javascript
async function themeGenerationAgent(contentGenerationId) {
  const context = { operation: 'theme_generation', contentGenerationId };
  
  return await withErrorHandling(async () => {
    const generation = await getContentGeneration(contentGenerationId);
    const user = await getUser(generation.user_id);
    const whitepaper = await getWhitepaper(generation.whitepaper_id);
    
    console.log('Searching Pinecone for relevant content');
    // Search relevant content from Pinecone
    const relevantContent = await searchPinecone(
      user.pinecone_api_key,
      user.pinecone_index_name,
      whitepaper.pinecone_namespace,
      "content themes marketing angles",
      20
    );

    const messages = [
      {
        role: "user",
        content: `Brief: ${JSON.stringify(generation.brief_data)}
        
Relevant white paper content:
${relevantContent.map(chunk => chunk.fields.text).join('\n\n')}

Generate 3 content themes for this marketing campaign.`
      }
    ];
    
    const response = await callClaudeWithThink(
      user.anthropic_api_key,
      messages,
      'theme_generation'
    );
    
    const parsedThemes = parseThemesFromResponse(response);
    await updateContentGeneration(contentGenerationId, {
      generated_themes: parsedThemes,
      status: 'theme_selection'
    });
    
    return parsedThemes;
  }, context);
}
```

### Agent 3: Research Agent (Claude Sonnet 4 + Think Tool)
```javascript
async function researchAgent(contentGenerationId) {
  const context = { operation: 'research', contentGenerationId };
  
  return await withErrorHandling(async () => {
    const generation = await getContentGeneration(contentGenerationId);
    const user = await getUser(generation.user_id);
    const whitepaper = await getWhitepaper(generation.whitepaper_id);
    
    // Perform 10-20 targeted vector searches based on selected theme
    const selectedTheme = generation.selected_theme;
    const searchQueries = generateResearchQueries(selectedTheme);
    
    console.log(`Performing ${searchQueries.length} research queries`);
    let researchData = [];
    for (const query of searchQueries) {
      const results = await searchPinecone(
        user.pinecone_api_key,
        user.pinecone_index_name,
        whitepaper.pinecone_namespace,
        query,
        10
      );
      researchData.push({ query, results });
    }

    const response = await callClaudeWithThink(
      user.anthropic_api_key,
      [{ role: "user", content: `Research data: ${JSON.stringify(researchData)}` }],
      'research'
    );
    
    const parsedResearch = parseResearchFromResponse(response);
    await updateContentGeneration(contentGenerationId, {
      research_data: parsedResearch,
      status: 'drafting'
    });
    
    return parsedResearch;
  }, context);
}
```

### Agent 4: Drafting Agent (Claude Sonnet 4 + Think Tool)
```javascript
async function draftingAgent(contentGenerationId) {
  const context = { operation: 'drafting', contentGenerationId };
  
  return await withErrorHandling(async () => {
    const generation = await getContentGeneration(contentGenerationId);
    const user = await getUser(generation.user_id);
    
    const contentRequest = `
Brief: ${JSON.stringify(generation.brief_data)}
Selected Theme: ${JSON.stringify(generation.selected_theme)}
Research: ${JSON.stringify(generation.research_data)}

Generate the complete content package according to specifications.`;

    const response = await callClaudeWithThink(
      user.anthropic_api_key,
      [{ role: "user", content: contentRequest }],
      'drafting'
    );
    
    const parsedContent = parseContentFromResponse(response);
    await updateContentGeneration(contentGenerationId, {
      generated_content: parsedContent,
      status: 'copy_editing'
    });
    
    return parsedContent;
  }, context);
}
```

### Agent 5: Copy Editing Agent (Claude Sonnet 4 + Think Tool)
```javascript
async function copyEditingAgent(contentGenerationId) {
  const context = { operation: 'copy_editing', contentGenerationId };
  
  return await withErrorHandling(async () => {
    const generation = await getContentGeneration(contentGenerationId);
    const user = await getUser(generation.user_id);

    const response = await callClaudeWithThink(
      user.anthropic_api_key,
      [{ role: "user", content: `Edit this content: ${JSON.stringify(generation.generated_content)}` }],
      'copy_editing'
    );
    
    const editedContent = parseEditedContentFromResponse(response);
    await updateContentGeneration(contentGenerationId, {
      generated_content: editedContent,
      status: 'completed'
    });
    
    console.log(`Content generation ${contentGenerationId} completed successfully`);
    return editedContent;
  }, context);
}
```

## Admin Features - Prompt Configuration Interface

### Admin Authentication Middleware
```javascript
// middleware/adminAuth.js
export async function adminAuthMiddleware(req, res, next) {
  const user = await getCurrentUser(req);
  
  if (!user || !['admin', 'developer'].includes(user.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
}
```

### Admin Dashboard - Prompt Management
```jsx
// components/admin/PromptManager.jsx
import { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';

export default function PromptManager() {
  const [activeAgent, setActiveAgent] = useState('theme_generation');
  const [prompts, setPrompts] = useState({});
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [versions, setVersions] = useState([]);
  
  const agents = [
    { id: 'brief_generation', name: 'Brief Generation', model: 'OpenAI O3' },
    { id: 'theme_generation', name: 'Theme Generation', model: 'Claude Sonnet 4' },
    { id: 'research', name: 'Research Agent', model: 'Claude Sonnet 4' },
    { id: 'drafting', name: 'Drafting Agent', model: 'Claude Sonnet 4' },
    { id: 'copy_editing', name: 'Copy Editing', model: 'Claude Sonnet 4' }
  ];

  useEffect(() => {
    loadPrompts();
  }, [activeAgent]);

  const loadPrompts = async () => {
    const response = await fetch(`/api/admin/prompts/${activeAgent}`);
    const data = await response.json();
    setVersions(data.versions);
    setCurrentPrompt(data.active?.prompt_text || '');
  };

  const savePrompt = async () => {
    await fetch('/api/admin/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_name: activeAgent,
        prompt_text: currentPrompt,
        description: `Updated ${new Date().toLocaleString()}`
      })
    });
    loadPrompts();
  };

  const activateVersion = async (versionId) => {
    await fetch(`/api/admin/prompts/${versionId}/activate`, { method: 'POST' });
    loadPrompts();
  };

  const testPrompt = async () => {
    // Implementation for testing prompt with sample data
    const response = await fetch('/api/admin/prompts/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_name: activeAgent,
        prompt_text: currentPrompt,
        test_data: getSampleTestData(activeAgent)
      })
    });
    const result = await response.json();
    console.log('Test result:', result);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Agent Prompt Configuration</h1>
        
        {/* Agent Selection Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setActiveAgent(agent.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeAgent === agent.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {agent.name}
                  <span className="ml-2 text-xs text-gray-400">({agent.model})</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Prompt Editor */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">
                  System Prompt Editor - {agents.find(a => a.id === activeAgent)?.name}
                </h2>
                <div className="space-x-2">
                  <button
                    onClick={testPrompt}
                    className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Test Prompt
                  </button>
                  <button
                    onClick={savePrompt}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Save New Version
                  </button>
                </div>
              </div>
              <div className="p-6">
                <Editor
                  height="600px"
                  defaultLanguage="markdown"
                  value={currentPrompt}
                  onChange={setCurrentPrompt}
                  options={{
                    minimap: { enabled: false },
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    fontSize: 14
                  }}
                />
              </div>
            </div>
          </div>

          {/* Version History */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Version History</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-4 border rounded-lg ${
                      version.is_active ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-sm">
                          Version {version.version}
                          {version.is_active && (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(version.created_at).toLocaleString()}
                        </div>
                      </div>
                      {!version.is_active && (
                        <button
                          onClick={() => activateVersion(version.id)}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                    {version.description && (
                      <p className="text-sm text-gray-600">{version.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Admin API Routes

#### Prompt Management APIs
```javascript
// pages/api/admin/prompts/[agent].js
export default async function handler(req, res) {
  // Check admin auth
  await adminAuthMiddleware(req, res, () => {});

  const { agent } = req.query;

  if (req.method === 'GET') {
    const versions = await supabase
      .from('agent_prompts')
      .select('*')
      .eq('agent_name', agent)
      .order('version', { ascending: false });

    const active = await supabase
      .from('agent_prompts')
      .select('*')
      .eq('agent_name', agent)
      .eq('is_active', true)
      .single();

    res.json({ versions: versions.data, active: active.data });
  }
}

// pages/api/admin/prompts/index.js
export default async function handler(req, res) {
  await adminAuthMiddleware(req, res, () => {});

  if (req.method === 'POST') {
    const { agent_name, prompt_text, description } = req.body;
    
    // Get next version number
    const { data: lastVersion } = await supabase
      .from('agent_prompts')
      .select('version')
      .eq('agent_name', agent_name)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const newVersion = (lastVersion?.version || 0) + 1;

    const { data, error } = await supabase
      .from('agent_prompts')
      .insert({
        agent_name,
        prompt_text,
        version: newVersion,
        description,
        created_by: req.user.id
      });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, data });
  }
}

// pages/api/admin/prompts/[id]/activate.js
export default async function handler(req, res) {
  await adminAuthMiddleware(req, res, () => {});

  const { id } = req.query;

  if (req.method === 'POST') {
    // Get the prompt to activate
    const { data: prompt } = await supabase
      .from('agent_prompts')
      .select('agent_name')
      .eq('id', id)
      .single();

    // Deactivate all other versions for this agent
    await supabase
      .from('agent_prompts')
      .update({ is_active: false })
      .eq('agent_name', prompt.agent_name);

    // Activate the selected version
    const { data, error } = await supabase
      .from('agent_prompts')
      .update({ is_active: true })
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true });
  }
}

// pages/api/admin/prompts/test.js
export default async function handler(req, res) {
  await adminAuthMiddleware(req, res, () => {});

  if (req.method === 'POST') {
    const { agent_name, prompt_text, test_data } = req.body;
    
    // Run test with the prompt
    try {
      let testResult;
      
      if (agent_name === 'brief_generation') {
        // Test with OpenAI O3
        testResult = await testOpenAIPrompt(prompt_text, test_data);
      } else {
        // Test with Claude Sonnet 4
        testResult = await testClaudePrompt(prompt_text, test_data);
      }

      // Store test result
      await supabase.from('prompt_test_results').insert({
        prompt_id: null, // Could link to prompt version if saved
        test_input: test_data,
        test_output: testResult,
        tested_by: req.user.id
      });

      res.json({ success: true, result: testResult });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

## Frontend Implementation

### User Dashboard
- List of uploaded whitepapers with processing status
- Content generation history
- API key management interface
- Export functionality for completed content

### Admin Dashboard (New)
- Accessible only to admin/developer users
- Prompt configuration interface with Monaco Editor
- Version management and rollback capability
- Prompt testing with sample data
- Performance analytics for different prompt versions

### Content Generation Workflow
1. **Whitepaper Selection**: Choose from uploaded whitepapers
2. **Brief Creation**: Form for persona, goals, output preferences, CTA
3. **Theme Selection**: Display 3 generated themes as cards with regeneration option
4. **Processing Status**: Real-time updates during agent execution
5. **Content Review**: Display generated content with export options

### Theme Selection Interface
```jsx
function ThemeSelection({ themes, onSelect, onRegenerate }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {themes.map((theme, index) => (
        <div key={index} className="border rounded-lg p-6 cursor-pointer hover:border-blue-500">
          <h3 className="text-xl font-bold mb-4">{theme.name}</h3>
          <p className="text-gray-600 mb-4">{theme.description}</p>
          <div className="mb-4">
            <strong>Why this works:</strong>
            <p className="text-sm mt-2">{theme.rationale}</p>
          </div>
          <button onClick={() => onSelect(theme)} className="w-full bg-blue-500 text-white py-2 rounded">
            Select This Theme
          </button>
        </div>
      ))}
      <div className="col-span-full text-center">
        <button onClick={onRegenerate} className="text-blue-500 underline">
          Don't like these options? Generate new themes
        </button>
      </div>
    </div>
  );
}
```

## API Routes Structure

### Authentication & User Management
- `POST /api/auth/register` - Create account and Pinecone index
- `POST /api/auth/login` - User login
- `PUT /api/user/api-keys` - Update and validate API keys
- `GET /api/user/profile` - Get user profile and settings

### Whitepaper Management
- `POST /api/whitepapers/upload` - Upload and process whitepaper
- `GET /api/whitepapers` - List user's whitepapers
- `DELETE /api/whitepapers/[id]` - Delete whitepaper and namespace

### Content Generation
- `POST /api/generate/start` - Start content generation workflow (creates background job)
- `GET /api/generate/[id]/status` - Get generation status (job status polling)
- `POST /api/generate/[id]/select-theme` - Select theme and continue workflow
- `POST /api/generate/[id]/regenerate-themes` - Regenerate theme options
- `GET /api/generate/[id]/export` - Export generated content (PDF/DOCX/text)

### Admin Routes (New)
- `GET /api/admin/prompts/[agent]` - Get prompt versions for agent
- `POST /api/admin/prompts` - Create new prompt version
- `POST /api/admin/prompts/[id]/activate` - Activate prompt version
- `POST /api/admin/prompts/test` - Test prompt with sample data
- `GET /api/admin/users` - Manage user roles
- `PUT /api/admin/users/[id]/role` - Update user role

## Security & Access Control

### Role-Based Access Control
```javascript
// middleware/rbac.js
export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    const user = await getCurrentUser(req);
    
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: user?.role 
      });
    }
    
    req.user = user;
    next();
  };
};

// Usage in API routes
export default requireRole(['admin', 'developer'])(async function handler(req, res) {
  // Admin-only logic here
});
```

### Environment Variables for Admin Setup
```bash
# Admin Configuration
INITIAL_ADMIN_EMAILS=admin@company.com,dev@company.com
ADMIN_PANEL_ENABLED=true

# Feature Flags
ENABLE_PROMPT_TESTING=true
ENABLE_PERFORMANCE_METRICS=true
```

## Deployment Configuration

### Vercel Environment Variables
```
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# File Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# Job Queue (Vercel KV)
KV_REST_API_URL=your_vercel_kv_url
KV_REST_API_TOKEN=your_vercel_kv_token

# Admin Configuration
INITIAL_ADMIN_EMAILS=admin@company.com,dev@company.com
ADMIN_PANEL_ENABLED=true

# Company API Keys (for admin testing)
COMPANY_OPENAI_API_KEY=your_company_openai_key
COMPANY_ANTHROPIC_API_KEY=your_company_anthropic_key
COMPANY_PINECONE_API_KEY=your_company_pinecone_key

# Encryption
API_KEY_ENCRYPTION_SECRET=your_32_character_secret_key
```

### Vercel Functions Configuration
- **Memory**: 1024 MB for agent functions
- **Timeout**: 60 seconds for processing functions
- **Regions**: Deploy to regions closest to your users

### File Upload Limits
- Max file size: 50MB for whitepapers
- Supported formats: PDF, DOCX
- Vercel Blob storage for file persistence

## Development Setup Instructions

### Prerequisites
- Node.js 18+
- Vercel CLI
- Supabase account
- Pinecone account
- API keys for OpenAI and Anthropic (for testing)

### Local Development Setup
1. Clone repository and install dependencies:
```bash
npm install
npm install -g vercel
npm install @monaco-editor/react
npm install docx jspdf pdf-lib
npm install @vercel/kv
```

2. Set up Supabase:
   - Create new Supabase project
   - Run database migrations from `/supabase/migrations`
   - Configure Row Level Security policies
   - Insert default prompts

3. Set up Vercel KV:
   - Create Vercel KV database for job queue
   - Add KV credentials to environment variables

4. Configure environment variables:
```bash
cp .env.example .env.local
# Fill in all required environment variables including encryption secret
```

5. Initialize default prompts:
```bash
npm run setup:prompts
```

6. Start development server:
```bash
vercel dev
```

### Database Migrations
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE whitepapers ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_test_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only see their own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can only see their own whitepapers" ON whitepapers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only see their own generations" ON content_generations FOR ALL USING (auth.uid() = user_id);

-- Admin-only policies
CREATE POLICY "Only admins can manage prompts" ON agent_prompts FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'developer')
  )
);

CREATE POLICY "Only admins can see test results" ON prompt_test_results FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'developer')
  )
);

-- Insert default prompts
INSERT INTO agent_prompts (agent_name, prompt_text, version, is_active, is_default) VALUES
('brief_generation', 'Based on this white paper content, generate a comprehensive marketing brief...', 1, true, true),
('theme_generation', 'You are a content strategist generating marketing themes...', 1, true, true),
('research', 'You are a research analyst compiling comprehensive research...', 1, true, true),
('drafting', 'You are a content creator generating marketing materials...', 1, true, true),
('copy_editing', 'You are a professional copy editor applying The Economist style guide...', 1, true, true);
```

### Testing Strategy
- Unit tests for agent functions with error handling
- Integration tests for Pinecone operations and queue system
- End-to-end tests for complete workflow including background processing
- API key validation testing with proper error responses
- Error handling and retry logic testing
- **Admin feature testing**: Prompt management, version control, role-based access
- **Performance testing**: Background job processing and queue management
- **Export functionality testing**: PDF/DOCX generation with sample content

### Development Logging Strategy
For MVP development and testing:
- **Console logging** for all operations during development
- **Structured logging** with operation context and user IDs
- **Error logging** with full stack traces for debugging
- **Job queue logging** for background process monitoring
- **Remove console logs** after feature implementation and testing completion

```javascript
// Development logging pattern
const logger = {
  info: (message, context = {}) => {
    console.log(`[INFO] ${message}`, context);
  },
  error: (message, error, context = {}) => {
    console.error(`[ERROR] ${message}`, { error: error.message, stack: error.stack, ...context });
  },
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data);
    }
  }
};
```

### Admin Setup Script
```javascript
// scripts/setup-admin.js
async function setupInitialAdmins() {
  const adminEmails = process.env.INITIAL_ADMIN_EMAILS?.split(',') || [];
  
  for (const email of adminEmails) {
    await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('email', email.trim());
  }
  
  console.log(`Set up ${adminEmails.length} admin users`);
}
```

This comprehensive technical specification now includes the admin prompt configuration feature that allows developers and administrators to test and optimize agent prompts during development, while keeping this functionality separate from the client-facing application.