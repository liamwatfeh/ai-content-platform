Agent 1:
Model: o3-2025-04-16 System prompt: 
generate a detailed marketing brief from the following users data that is optimsied for an LLM to read
User prompt: Users business context: {Your business context} Users target Audience: {Who is your target audience?} Users marketing goals : {What are your marketing goals?}
Users CTA: {CTA} Tools:
Output parser - schema (TBC)
Agent 2:
Model: o3-2025-04-16 or claude sonnet 4 (with thinking enabled) System prompt: 
generate 3 campaign ideas based on the marketing brief and the whitepaper - use the pinecone search tool
User prompt: Marketing brief: {Brief} Tools:
Output parser - schema (unknown)
Pinecone search tool
Think tool (if sonnet 4 model)
Agent 3:
Model: o3-2025-04-16 or claude sonnet 4 (with thinking enabled) System prompt: 
Based on the users approved theme, do some deep research using the pinecone tool on this particular idea. Extract lots of details around this key theme.
User prompt: Theme: {theme the user chose} Tools:
Output parser - schema (unknown)
Pinecone search tool Think tool (if sonnet 4 model)
Agent 4a (article):
Model: claude sonnet 4 (with thinking enabled) System prompt: 
Draft an article that is 1000 words for this specific company. The research has already been done for you, here is the marketing brief, theme + research, write me an article in using the economist style guide. - you have access to the pinecone vector store tool if you need additional info from the whitepaper for this draft.
User prompt: {marketing brief}
{research}
{theme} Tools:
Output parser - schema (unknown)
Pinecone search tool Think tool (if sonnet 4 model)
Agent 4b (Linekdin Post):
Model: claude sonnet 4 (with thinking enabled) System prompt: 
Draft {number of linekdin posts the user requested} Linekdin posts that is 1000 words for this specific company. The research has already been done for you, here is the marketing brief, theme + research, write me an article in using the economist style guide. - you have access to the pinecone vector store tool if you need additional info from the whitepaper for this draft.
User prompt: {marketing brief}
{research}
{theme} Tools:
Output parser - schema (unknown)
Pinecone search tool Think tool (if sonnet 4 model)
Agent 4c (Social Captions):
Model: claude sonnet 4 (with thinking enabled) System prompt: 
Draft {number of social posts the user requested} social posts that is 1000 words for this specific company. The research has already been done for you, here is the marketing brief, theme + research, write me an article in using the economist style guide. - you have access to the pinecone vector store tool if you need additional info from the whitepaper for this draft.
User prompt: {marketing brief}
{research}
{theme} Tools:
Output parser - schema (unknown)
Pinecone search tool Think tool (if sonnet 4 model)
Agent 5a,b,c:
Model: claude sonnet 4 (with thinking enabled) System prompt: 
Proof read this draft and edit it to make it better. Use economist style guide
User prompt: {marketing brief}
{draft} Tools:
Output parser - schema (unknown) Think tool (if sonnet 4 model)
This agent will have 3x variations like above that suit the proof reading/editing of the particular medium**.
OUTPUT: MEDIA THAT IS ALMOST READY 