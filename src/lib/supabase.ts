import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

// Server-side client with service role key for admin operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Types for our database tables
export interface ReferenceBucket {
  id: string;
  name: string;
  description: string | null;
  pinecone_index_name: string;
  status: "creating" | "active" | "failed" | "deleted";
  created_at: string;
  updated_at: string;
  whitepaper_count: number;
}

export interface Whitepaper {
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
