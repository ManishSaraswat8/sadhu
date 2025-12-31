-- Fix function search path security issue
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
SECURITY DEFINER
SET search_path = public
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