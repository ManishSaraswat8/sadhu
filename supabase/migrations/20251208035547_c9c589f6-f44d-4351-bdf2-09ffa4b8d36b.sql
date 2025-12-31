-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create memories table with vector embeddings
CREATE TABLE public.meditation_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  session_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  memory_type TEXT DEFAULT 'session' CHECK (memory_type IN ('session', 'insight', 'progress', 'preference')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for vector similarity search
CREATE INDEX ON public.meditation_memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create index for user lookups
CREATE INDEX idx_meditation_memories_user_id ON public.meditation_memories(user_id);

-- Enable RLS
ALTER TABLE public.meditation_memories ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own memories" 
ON public.meditation_memories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memories" 
ON public.meditation_memories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories" 
ON public.meditation_memories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function for similarity search
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(1536),
  match_user_id UUID,
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  memory_type TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mm.id,
    mm.content,
    mm.memory_type,
    mm.metadata,
    1 - (mm.embedding <=> query_embedding) AS similarity
  FROM public.meditation_memories mm
  WHERE mm.user_id = match_user_id
    AND 1 - (mm.embedding <=> query_embedding) > match_threshold
  ORDER BY mm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;