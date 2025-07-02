# AI Content Platform

Transform white papers into complete marketing campaigns using AI-powered content generation.

## Features

- **PDF Processing**: Extract text from PDF documents with intelligent chunking
- **AI Content Enhancement**: Use OpenAI to generate contextual information for better searchability
- **Vector Storage**: Store processed content in Pinecone for semantic search
- **File Management**: Upload and manage white papers with Supabase Storage
- **Real-time Status**: Track processing status with live updates

## Quick Start

### 1. Environment Setup

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI APIs
OPENAI_API_KEY=your_openai_api_key

# Vector Database
PINECONE_API_KEY=your_pinecone_api_key

# Optional
NODE_ENV=development
```

### 2. Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Set up Storage Bucket**:

   ```sql
   -- Create the whitepapers storage bucket
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('whitepapers', 'whitepapers', true);
   ```

3. **Set up Storage Policies**:

   ```sql
   -- Allow public read access to whitepapers
   CREATE POLICY "Public Access" ON storage.objects
   FOR SELECT USING (bucket_id = 'whitepapers');

   -- Allow authenticated users to upload
   CREATE POLICY "Authenticated users can upload" ON storage.objects
   FOR INSERT WITH CHECK (bucket_id = 'whitepapers');

   -- Allow authenticated users to delete their uploads
   CREATE POLICY "Users can delete own uploads" ON storage.objects
   FOR DELETE USING (bucket_id = 'whitepapers');
   ```

4. **Database Tables**: The application will create the necessary tables automatically.

### 3. API Keys Setup

- **OpenAI**: Get your API key from [platform.openai.com](https://platform.openai.com)
- **Pinecone**: Get your API key from [pinecone.io](https://pinecone.io)

### 4. Run the Application

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to start using the application.

## Architecture

### Simplified Storage Architecture

- **Database**: Supabase PostgreSQL for metadata and status tracking
- **File Storage**: Supabase Storage for PDF files (replacing Vercel Blob)
- **Vector Storage**: Pinecone for semantic search
- **AI Processing**: OpenAI for text enhancement

### Processing Pipeline

1. **Upload**: Files stored in Supabase Storage with unique paths
2. **Extraction**: PDF text extracted using pdf-parse
3. **Chunking**: Text split into ~800 token chunks with sentence boundaries
4. **Enhancement**: Each chunk enhanced with contextual information via OpenAI
5. **Indexing**: Chunks stored in Pinecone with embeddings for semantic search

## Development

### Console Logging

The application includes comprehensive logging with categorized prefixes:

- `🚀 [PROCESSOR]` - Main processing stages
- `🔍 [PDF]` - PDF text extraction
- `✂️ [CHUNKER]` - Document chunking
- `🧠 [CONTEXT]` - AI context generation
- `📤 [PINECONE]` - Vector database operations
- `📊 [DATABASE]` - Supabase operations
- `🚀 [UPLOAD]` - File upload process

### Error Handling

- Comprehensive error logging with context
- Graceful fallbacks for failed operations
- JSON-only API responses (no HTML error pages)
- File cleanup on failed uploads

## Benefits of Supabase Storage

- ✅ **Unified Platform**: Database and storage in one place
- ✅ **Cost Effective**: Better pricing than separate blob storage
- ✅ **Built-in Auth**: Integrates with Supabase authentication
- ✅ **Fewer Dependencies**: Simplified architecture
- ✅ **Better DX**: Single admin interface for data and files

## Deployment

The application is optimized for deployment on Vercel with Supabase as the backend.

1. Deploy to Vercel
2. Set environment variables in Vercel dashboard
3. Ensure Supabase storage bucket and policies are configured

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with appropriate logging
4. Test thoroughly
5. Submit a pull request
