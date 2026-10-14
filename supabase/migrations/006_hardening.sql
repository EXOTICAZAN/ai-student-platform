-- =============================================================================
-- 006_hardening.sql — follow-up fixes found in review. Idempotent.
--
--   1. Drop the duplicate HNSW index on document_chunks.embedding
--      (003 and 004 each created one).
--   2. CHECK constraint on messages.role.
--   3. match_document_chunks no longer takes a user id: it was redundant with
--      RLS and invited callers to pass someone else's id. It now relies on RLS
--      (the function is SECURITY INVOKER) and auth.uid().
--   4. document_chunks inserts must reference a document the user owns.
--
-- Run in its own SQL editor tab, after 005.
-- =============================================================================

-- Supabase installs pgvector in the extensions schema. Keep both schemas
-- visible so this migration also works on projects where it is already enabled.
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
SET search_path = public, extensions;

-- 1. Duplicate index --------------------------------------------------------
DO $$
DECLARE
  n INTEGER;
BEGIN
  SELECT count(*) INTO n
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'document_chunks'
    AND indexname IN ('idx_document_chunks_embedding',
                      'document_chunks_embedding_hnsw_idx');

  IF n = 2 THEN
    DROP INDEX IF EXISTS public.idx_document_chunks_embedding;
    RAISE NOTICE 'Dropped duplicate index idx_document_chunks_embedding';
  ELSIF n = 0 THEN
    CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx
      ON public.document_chunks USING hnsw (embedding vector_cosine_ops);
  END IF;
END $$;

-- 2. messages.role ----------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.messages') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'messages_role_check'
         AND conrelid = 'public.messages'::regclass
     ) THEN
    -- NOT VALID: new rows are checked, existing rows are left alone.
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_role_check
      CHECK (role IN ('user', 'assistant')) NOT VALID;
  END IF;
END $$;

-- 3. match_document_chunks --------------------------------------------------
DROP FUNCTION IF EXISTS match_document_chunks(vector, uuid, uuid, integer);

CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding   vector(384),
  match_document_id UUID DEFAULT NULL,
  match_count       INTEGER DEFAULT 5
)
RETURNS TABLE (
  id          UUID,
  document_id UUID,
  user_id     UUID,
  chunk_index INTEGER,
  content     TEXT,
  similarity  DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  SELECT
    c.id,
    c.document_id,
    c.user_id,
    c.chunk_index,
    c.content,
    1 - (c.embedding <=> query_embedding)::double precision AS similarity
  FROM document_chunks c
  WHERE c.embedding IS NOT NULL
    AND c.user_id = auth.uid()
    AND (match_document_id IS NULL OR c.document_id = match_document_id)
  ORDER BY c.embedding <=> query_embedding
  LIMIT LEAST(GREATEST(match_count, 1), 50);
$$;

REVOKE ALL ON FUNCTION match_document_chunks(vector, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION match_document_chunks(vector, uuid, integer)
  TO authenticated, service_role;

-- 4. Chunk inserts must point at the caller's own document -------------------
DROP POLICY IF EXISTS "document_chunks_insert_own" ON document_chunks;
CREATE POLICY "document_chunks_insert_own" ON document_chunks
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_chunks.document_id AND d.user_id = auth.uid()
    )
  );

NOTIFY pgrst, 'reload schema';

SELECT
  (SELECT count(*) FROM pg_indexes
     WHERE schemaname = 'public' AND tablename = 'document_chunks'
       AND indexdef ILIKE '%hnsw%')                                   AS hnsw_indexes,
  (SELECT count(*) FROM pg_constraint
     WHERE conname = 'messages_role_check')                           AS role_check,
  (SELECT count(*) FROM pg_proc WHERE proname = 'match_document_chunks') AS rpc_count;
