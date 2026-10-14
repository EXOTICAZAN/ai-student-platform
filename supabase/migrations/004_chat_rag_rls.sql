-- =============================================================================
-- 004 · Version and lock down the tutor / RAG tables
-- =============================================================================
-- `chats`, `messages`, `documents` and `document_chunks` were created directly
-- in the Supabase dashboard, so the repo could not recreate them and — more
-- seriously — 002 grants full DML on them to `anon` and `authenticated` without
-- ever defining a Row Level Security policy. If they were also created without
-- RLS enabled, anyone holding the public anon key can read or delete every
-- user's tutor transcripts and uploaded-document metadata straight from
-- /rest/v1, bypassing this application entirely.
--
-- This file makes the schema reproducible and closes that hole. Every section
-- is idempotent: `CREATE TABLE IF NOT EXISTS` is a no-op against the existing
-- production tables, and the column reconciliation only adds what is missing.
--
-- Safe to re-run. Run AFTER 003 on an existing database.
-- =============================================================================

-- Supabase installs pgvector in the extensions schema. Keep both schemas
-- visible so this migration also works against databases where the extension
-- was previously enabled in public.
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
SET search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- 1. Tables
-- -----------------------------------------------------------------------------
-- documents before chats, because chats.document_id points at it.

CREATE TABLE IF NOT EXISTS documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  file_name    TEXT,
  storage_path TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'New Chat',
  document_id UUID REFERENCES documents (id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id    UUID NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
  role       TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_chunks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents (id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content     TEXT NOT NULL,
  embedding   vector(384),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. Reconcile columns on tables that already existed
-- -----------------------------------------------------------------------------
-- The live tables predate this file and their exact shape is unknown, so add
-- every column the application actually reads or writes. Deliberately nullable
-- and without NOT NULL: adding a NOT NULL column to a populated table fails.

ALTER TABLE documents      ADD COLUMN IF NOT EXISTS user_id      UUID;
ALTER TABLE documents      ADD COLUMN IF NOT EXISTS file_name    TEXT;
ALTER TABLE documents      ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE documents      ADD COLUMN IF NOT EXISTS created_at   TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE chats          ADD COLUMN IF NOT EXISTS user_id      UUID;
ALTER TABLE chats          ADD COLUMN IF NOT EXISTS title        TEXT DEFAULT 'New Chat';
ALTER TABLE chats          ADD COLUMN IF NOT EXISTS document_id  UUID;
ALTER TABLE chats          ADD COLUMN IF NOT EXISTS created_at   TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE chats          ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE messages       ADD COLUMN IF NOT EXISTS chat_id      UUID;
ALTER TABLE messages       ADD COLUMN IF NOT EXISTS role         TEXT;
ALTER TABLE messages       ADD COLUMN IF NOT EXISTS content      TEXT;
ALTER TABLE messages       ADD COLUMN IF NOT EXISTS created_at   TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS document_id UUID;
ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS user_id     UUID;
ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS chunk_index INTEGER;
ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS content     TEXT;
ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ DEFAULT NOW();

-- -----------------------------------------------------------------------------
-- 3. Indexes for the queries the app actually runs
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS chats_user_created_idx
  ON chats (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS messages_chat_created_idx
  ON messages (chat_id, created_at ASC);

CREATE INDEX IF NOT EXISTS documents_user_created_idx
  ON documents (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS document_chunks_document_idx
  ON document_chunks (document_id, chunk_index);

CREATE INDEX IF NOT EXISTS document_chunks_user_idx
  ON document_chunks (user_id);

-- Re-ingestion is filtered on `embedding IS NULL`; 003 owns the HNSW index.
CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx
  ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- -----------------------------------------------------------------------------
-- 4. Row Level Security — the actual fix
-- -----------------------------------------------------------------------------
-- FORCE is set as well as ENABLE: without it, a table owner or a SECURITY
-- DEFINER function bypasses the policies silently.

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['chats', 'messages', 'documents', 'document_chunks']
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;

-- messages and document_chunks are reached through their parent, so ownership
-- is expressed via the owning chat / document row.

DROP POLICY IF EXISTS "chats_select_own"          ON chats;
DROP POLICY IF EXISTS "chats_insert_own"           ON chats;
DROP POLICY IF EXISTS "chats_update_own"           ON chats;
DROP POLICY IF EXISTS "chats_delete_own"           ON chats;
DROP POLICY IF EXISTS "messages_select_own"        ON messages;
DROP POLICY IF EXISTS "messages_insert_own"        ON messages;
DROP POLICY IF EXISTS "messages_update_own"        ON messages;
DROP POLICY IF EXISTS "messages_delete_own"        ON messages;
DROP POLICY IF EXISTS "documents_select_own"       ON documents;
DROP POLICY IF EXISTS "documents_insert_own"       ON documents;
DROP POLICY IF EXISTS "documents_update_own"       ON documents;
DROP POLICY IF EXISTS "documents_delete_own"       ON documents;
DROP POLICY IF EXISTS "document_chunks_select_own" ON document_chunks;
DROP POLICY IF EXISTS "document_chunks_insert_own" ON document_chunks;
DROP POLICY IF EXISTS "document_chunks_update_own" ON document_chunks;
DROP POLICY IF EXISTS "document_chunks_delete_own" ON document_chunks;

CREATE POLICY "chats_select_own" ON chats
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "chats_insert_own" ON chats
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "chats_update_own" ON chats
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "chats_delete_own" ON chats
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "messages_select_own" ON messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM chats c WHERE c.id = messages.chat_id AND c.user_id = auth.uid()));
CREATE POLICY "messages_insert_own" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM chats c WHERE c.id = messages.chat_id AND c.user_id = auth.uid()));
CREATE POLICY "messages_update_own" ON messages
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM chats c WHERE c.id = messages.chat_id AND c.user_id = auth.uid()));
CREATE POLICY "messages_delete_own" ON messages
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM chats c WHERE c.id = messages.chat_id AND c.user_id = auth.uid()));

CREATE POLICY "documents_select_own" ON documents
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "documents_insert_own" ON documents
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "documents_update_own" ON documents
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "documents_delete_own" ON documents
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "document_chunks_select_own" ON document_chunks
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "document_chunks_insert_own" ON document_chunks
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "document_chunks_update_own" ON document_chunks
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "document_chunks_delete_own" ON document_chunks
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 5. Table grants
-- -----------------------------------------------------------------------------
-- 002 already grants these; repeated here so this file stands alone on a fresh
-- database. Each grant is existence-checked — an unguarded GRANT against a
-- missing table aborts the whole file.

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['chats', 'messages', 'documents', 'document_chunks']
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format(
        'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO anon, authenticated, service_role',
        t
      );
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 6. Storage bucket and object policies
-- -----------------------------------------------------------------------------
-- Uploaded PDFs live at `<user_id>/<uuid>.pdf` in a private bucket. No policy
-- existed for it, so access fell back to whatever the dashboard had set.

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "documents_objects_select_own" ON storage.objects;
DROP POLICY IF EXISTS "documents_objects_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "documents_objects_update_own" ON storage.objects;
DROP POLICY IF EXISTS "documents_objects_delete_own" ON storage.objects;

CREATE POLICY "documents_objects_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "documents_objects_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "documents_objects_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "documents_objects_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- -----------------------------------------------------------------------------
-- 7. Similarity search RPC
-- -----------------------------------------------------------------------------
-- Recreated so a fresh database that skipped 003 (its table did not exist yet)
-- still gets the function. SECURITY INVOKER, not DEFINER: a caller-supplied
-- match_user_id must not become a way to read someone else's chunks. The
-- explicit user_id predicate is belt-and-braces on top of RLS.

DROP FUNCTION IF EXISTS match_document_chunks(vector, uuid, uuid, integer);

CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding  vector(384),
  match_user_id    UUID,
  match_document_id UUID DEFAULT NULL,
  match_count      INTEGER DEFAULT 5
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

-- -----------------------------------------------------------------------------
-- 8. Reload the PostgREST schema cache and verify
-- -----------------------------------------------------------------------------

NOTIFY pgrst, 'reload schema';

SELECT
  t.table_name,
  c.relrowsecurity  AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  (SELECT COUNT(*) FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = t.table_name) AS policies
FROM (VALUES ('chats'), ('messages'), ('documents'), ('document_chunks')) AS t(table_name)
JOIN pg_class c ON c.oid = to_regclass('public.' || t.table_name)
ORDER BY t.table_name;
