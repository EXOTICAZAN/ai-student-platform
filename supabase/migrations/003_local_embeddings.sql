-- =============================================================
-- EduForge AI — Local Embeddings Migration
-- Version: 003
-- Description: Retrieval switched from the Gemini embedding API to a
--              local transformers.js model (all-MiniLM-L6-v2), which
--              produces 384-dimensional vectors instead of 768.
--              This rebuilds document_chunks.embedding at the new
--              width, replaces its similarity index, recreates the
--              match_document_chunks RPC with a matching signature,
--              and pins down the row-level policies the RPC relies on.
--
-- Existing chunk TEXT is preserved. Existing VECTORS are discarded —
-- they came from a different model space, so they are meaningless
-- against the new ones and must be regenerated. After running this,
-- execute: node scripts/reembed-chunks.mjs
--
-- Safe to re-run: every step is guarded and idempotent.
-- =============================================================

-- Supabase installs pgvector in the extensions schema. Keep both schemas
-- visible so this migration also works against databases where the extension
-- was previously enabled in public.
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
SET search_path = public, extensions;

-- =============================================================
-- SECTION 1: Rebuild document_chunks.embedding at 384 dimensions
--
-- A vector column cannot be re-typed while it still holds values of
-- the old width, and any index over it must go first. The rows are
-- kept with a NULL embedding so the re-embed script can refill them
-- without re-parsing the original PDFs.
-- =============================================================

DO $$
DECLARE
  v_exists   BOOLEAN;
  v_dims     INTEGER;
  idx        RECORD;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'document_chunks'
      AND c.relkind = 'r'
  ) INTO v_exists;

  IF NOT v_exists THEN
    RAISE NOTICE 'document_chunks does not exist — skipping vector rebuild';
    RETURN;
  END IF;

  -- pgvector records the declared width in atttypmod; -1 means an
  -- unconstrained `vector` column, which also needs pinning.
  SELECT a.atttypmod INTO v_dims
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'document_chunks'
    AND a.attname = 'embedding'
    AND a.attnum > 0
    AND NOT a.attisdropped;

  -- pgvector stores dimensions as typmod - 4 on supported versions;
  -- tolerate both representations so re-runs do not rebuild the column.
  IF v_dims IN (384, 388) THEN
    RAISE NOTICE 'document_chunks.embedding is already vector(384) — nothing to do';
    RETURN;
  END IF;

  RAISE NOTICE 'Rebuilding document_chunks.embedding from % to vector(384)',
    COALESCE(v_dims::text, 'unconstrained');

  FOR idx IN
    SELECT DISTINCT ci.relname AS index_name
    FROM pg_index i
    JOIN pg_class ci ON ci.oid = i.indexrelid
    JOIN pg_class ct ON ct.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = ct.relnamespace
    JOIN pg_attribute a ON a.attrelid = ct.oid AND a.attnum = ANY (i.indkey)
    WHERE n.nspname = 'public'
      AND ct.relname = 'document_chunks'
      AND a.attname = 'embedding'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', idx.index_name);
    RAISE NOTICE '  dropped index %', idx.index_name;
  END LOOP;

  -- NULLing first is what makes the re-type legal: a NULL casts to any
  -- width, whereas a 768-dim value cannot be coerced to 384.
  EXECUTE 'ALTER TABLE public.document_chunks ALTER COLUMN embedding DROP NOT NULL';
  EXECUTE 'UPDATE public.document_chunks SET embedding = NULL WHERE embedding IS NOT NULL';
  EXECUTE 'ALTER TABLE public.document_chunks ALTER COLUMN embedding TYPE vector(384) USING NULL::vector(384)';

  -- Cosine ops match the <=> operator used by the RPC below. Vectors are
  -- L2-normalised at creation time, so cosine and inner product agree.
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
             ON public.document_chunks USING hnsw (embedding vector_cosine_ops)';
END $$;

-- =============================================================
-- SECTION 2: Row-level security for document_chunks
--
-- match_document_chunks runs as the calling role, so it returns rows
-- only where RLS allows them. Without an own-row policy the RPC would
-- silently return nothing; without the user_id predicate below it would
-- trust a caller-supplied id. Both layers are applied here.
-- =============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'document_chunks' AND c.relkind = 'r'
  ) THEN
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.document_chunks FORCE ROW LEVEL SECURITY';

  EXECUTE 'DROP POLICY IF EXISTS document_chunks_select_own ON public.document_chunks';
  EXECUTE 'DROP POLICY IF EXISTS document_chunks_insert_own ON public.document_chunks';
  EXECUTE 'DROP POLICY IF EXISTS document_chunks_update_own ON public.document_chunks';
  EXECUTE 'DROP POLICY IF EXISTS document_chunks_delete_own ON public.document_chunks';

  EXECUTE 'CREATE POLICY document_chunks_select_own ON public.document_chunks
             FOR SELECT TO authenticated USING (user_id = auth.uid())';
  EXECUTE 'CREATE POLICY document_chunks_insert_own ON public.document_chunks
             FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
  EXECUTE 'CREATE POLICY document_chunks_update_own ON public.document_chunks
             FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
  EXECUTE 'CREATE POLICY document_chunks_delete_own ON public.document_chunks
             FOR DELETE TO authenticated USING (user_id = auth.uid())';
END $$;

-- =============================================================
-- SECTION 3: match_document_chunks
--
-- Recreated so its query_embedding parameter matches the new column
-- width. A vector(768) parameter cannot be compared against a
-- vector(384) column, so the old signature would fail at call time
-- even after the column is rebuilt.
--
-- SECURITY INVOKER is deliberate: combined with the policies above it
-- keeps the RPC from being used to read another user's chunks.
-- =============================================================

CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding   vector(384),
  match_user_id     UUID,
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
    AND c.user_id = match_user_id
    AND (match_document_id IS NULL OR c.document_id = match_document_id)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION match_document_chunks(vector, uuid, uuid, integer)
  TO anon, authenticated, service_role;

-- =============================================================
-- SECTION 4: Refresh PostgREST's schema cache
-- Without this the API can keep serving the old column type and
-- report PGRST205/PGRST204 until it reloads on its own.
-- =============================================================

NOTIFY pgrst, 'reload schema';

-- =============================================================
-- Verification. Expected: embedding_dims = 384, rpc_present = t.
-- =============================================================

DO $$
DECLARE
  has_chunks BOOLEAN := to_regclass('public.document_chunks') IS NOT NULL;
BEGIN
  IF has_chunks THEN
    RAISE NOTICE 'document_chunks embedding typmod: %; null embeddings awaiting re-embed: %',
      (SELECT a.atttypmod FROM pg_attribute a
       JOIN pg_class c ON c.oid = a.attrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relname = 'document_chunks' AND a.attname = 'embedding'),
      (SELECT COUNT(*) FROM public.document_chunks WHERE embedding IS NULL);
  ELSE
    RAISE NOTICE 'document_chunks is not present yet; migration 004 will create it';
  END IF;
END $$;
