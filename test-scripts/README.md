# Test Scripts for Content Brain AI Pipeline

This directory contains test scripts to verify the functionality of all agents in the Content Brain AI pipeline.

## Available Test Scripts

### 1. Full Workflow Test (`test-full-workflow.mjs`)

Tests the complete pipeline from Agent 1 through Agent 5c with realistic data.

```bash
node test-scripts/test-full-workflow.mjs
```

**What it tests:**

- Agent 1: Brief Creator
- Agent 2: Theme Generator
- Agent 3: Deep Research
- Agents 4a/4b/4c: Content Generation (parallel)
- Agents 5a/5b/5c: Content Editing (parallel)

**Expected runtime:** 3-5 minutes (includes LLM API calls)

### 2. Content Generation + Editing Test (`test-agents-4abc-editors.mjs`)

Focused test for content generation and editing phases with mock data.

```bash
node test-scripts/test-agents-4abc-editors.mjs
```

**What it tests:**

- Agents 4a/4b/4c: Article, LinkedIn, Social content generation
- Agents 5a/5b/5c: Content editing and quality scoring
- Parallel execution performance

**Expected runtime:** 2-3 minutes

### 3. Quick Agent Test (`test-quick-agent.mjs`)

Test individual agents quickly with command-line arguments.

```bash
node test-scripts/test-quick-agent.mjs [agent-number]
```

**Examples:**

```bash
node test-scripts/test-quick-agent.mjs 1     # Test Brief Creator
node test-scripts/test-quick-agent.mjs 4a    # Test Article Writer
node test-scripts/test-quick-agent.mjs 5b    # Test LinkedIn Editor
```

**Available agents:**

- `1` - Brief Creator
- `2` - Theme Generator
- `3` - Deep Research
- `4a` - Article Writer
- `4b` - LinkedIn Writer
- `4c` - Social Writer
- `5a` - Article Editor
- `5b` - LinkedIn Editor
- `5c` - Social Editor

### 4. Agent 1 Only Test (`test-agent1-brief.mjs`)

Focused test for just the Brief Creator agent.

```bash
node test-scripts/test-agent1-brief.mjs
```

**Expected runtime:** 30-60 seconds

## Prerequisites

### Environment Variables

Ensure these are set in your `.env.local` file:

```env
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```

### Dependencies

All test scripts use the existing project dependencies. Make sure you've run:

```bash
npm install
```

## Running Tests

### Quick Verification

Start with the quick agent test to verify individual components:

```bash
# Test the first few agents
node test-scripts/test-quick-agent.mjs 1
node test-scripts/test-quick-agent.mjs 4a
node test-scripts/test-quick-agent.mjs 5a
```

### Content Pipeline Test

Test the core content generation and editing:

```bash
node test-scripts/test-agents-4abc-editors.mjs
```

### Full Pipeline Test

Run the complete end-to-end workflow:

```bash
node test-scripts/test-full-workflow.mjs
```

## Test Output Examples

### Successful Test Output

```
🧪 Testing Agent 1 (Brief Creator)
============================================================
✅ Agent 1 completed successfully in 2.34s
📊 Results Analysis:
📝 Marketing Brief Generated: ✅
📏 Brief Length: 1,247 characters
🎯 Contains Business Context: ✅
👥 Contains Audience Info: ✅
🎪 Contains Marketing Goals: ✅
```

### Performance Monitoring

```
⚡ Performance Summary:
📝 Content Generation: 45.23s
✏️ Content Editing: 28.67s
🚀 Total Time: 73.90s
⚡ Parallel Efficiency: 100.0%
```

## Troubleshooting

### Common Issues

1. **Missing API Keys**

   ```
   ❌ OPENAI_API_KEY not found in environment
   ```

   - Ensure `.env.local` file exists with valid API keys

2. **Import Errors**

   ```
   Error: Cannot resolve module
   ```

   - Run from the `cb` directory
   - Ensure all dependencies are installed

3. **Agent Failures**
   - Check API key validity and rate limits
   - Verify network connectivity
   - Review error stack traces for specific issues

### Performance Expectations

| Test Script          | Expected Duration | API Calls |
| -------------------- | ----------------- | --------- |
| Quick Agent (single) | 30-60s            | 1         |
| Agent 1 Only         | 30-60s            | 1         |
| Content Gen + Edit   | 2-3 minutes       | 6         |
| Full Workflow        | 3-5 minutes       | 8         |

## Development Tips

- Use quick agent tests during development for faster iteration
- Run content generation tests to verify parallel execution
- Use full workflow test for integration verification
- Monitor performance metrics to identify bottlenecks

## Adding New Tests

To add a new test script:

1. Create `.mjs` file in `test-scripts/` directory
2. Use ES modules with dynamic imports
3. Include environment variable checks
4. Add comprehensive error handling
5. Update this README with usage instructions
