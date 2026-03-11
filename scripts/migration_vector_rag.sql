-- ============================================================
-- Enable pgvector for RAG (Retrieval-Augmented Generation)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create document_chunks table
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id BIGINT REFERENCES public.documents(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  embedding VECTOR(768), -- Using 768 for Google Gemini text-embedding-004 or similar
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create a vector index for faster search
-- Using HNSW for high performance
CREATE INDEX ON public.document_chunks USING hnsw (embedding vector_cosine_ops);

-- 4. Enable RLS
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- 5. Manager isolation policy
CREATE POLICY "Managers can search their own document chunks"
  ON public.document_chunks FOR SELECT
  USING (manager_id = auth.uid());

-- 6. RPC function for vector similarity search
CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT,
  p_manager_id UUID
)
RETURNS TABLE (
  id UUID,
  document_id BIGINT,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    dc.metadata
  FROM public.document_chunks dc
  WHERE dc.manager_id = p_manager_id
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
