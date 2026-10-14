-- =============================================================
-- EduForge AI — Study Features Migration
-- Version: 002
-- Description: Creates tables backing AI Notes, Flashcards,
--              Quiz Generator, Study Planner, Analytics,
--              Settings, notifications and the activity feed.
--              Also repairs grants on the pre-existing
--              tutor/RAG tables and the profiles bootstrap.
--
-- Safe to run on a project where 001 has already been applied.
-- =============================================================

-- =============================================================
-- ENUMS
-- =============================================================

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE quiz_difficulty AS ENUM ('easy', 'medium', 'hard', 'mixed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM (
    'note', 'flashcard', 'quiz', 'task', 'tutor', 'scholarship', 'profile'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================
-- PROFILES — repair / bootstrap
-- The `profiles` table predates this repo's migrations. Make sure
-- every column the UI writes actually exists, and that a row is
-- created automatically on signup (ProfileForm used .update(),
-- which silently no-oped when no row existed).
-- =============================================================
-- A clean install has no dashboard-created profiles/documents table yet.
-- Create the smallest compatible shells here; 004 reconciles the complete
-- tutor/RAG schema later in the ordered migration chain.
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id                UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name         TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email             TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country           TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grade             TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS learning_goal     TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_degree     TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'English';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url        TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at        TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ DEFAULT NOW();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Backfill rows for users created before this trigger existed.
INSERT INTO profiles (id, email, full_name)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1))
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- TABLE: notes
-- =============================================================

CREATE TABLE IF NOT EXISTS notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Untitled note',
  content     TEXT NOT NULL DEFAULT '',
  summary     TEXT,
  subject     TEXT,
  tags        JSONB NOT NULL DEFAULT '[]',
  source_type TEXT NOT NULL DEFAULT 'manual',   -- 'manual', 'ai', 'pdf'
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: flashcard_decks / flashcards
-- `ease`, `interval_days`, `due_at` drive a simplified SM-2
-- spaced-repetition schedule.
-- =============================================================

CREATE TABLE IF NOT EXISTS flashcard_decks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  subject     TEXT,
  description TEXT,
  note_id     UUID REFERENCES notes(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flashcards (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id           UUID NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  front             TEXT NOT NULL,
  back              TEXT NOT NULL,
  hint              TEXT,
  ease              REAL NOT NULL DEFAULT 2.5,
  interval_days     INTEGER NOT NULL DEFAULT 0,
  reviews           INTEGER NOT NULL DEFAULT 0,
  lapses            INTEGER NOT NULL DEFAULT 0,
  due_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reviewed_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: quizzes / quiz_questions / quiz_attempts
-- =============================================================

CREATE TABLE IF NOT EXISTS quizzes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  subject        TEXT,
  topic          TEXT,
  difficulty     quiz_difficulty NOT NULL DEFAULT 'mixed',
  question_count INTEGER NOT NULL DEFAULT 0,
  note_id        UUID REFERENCES notes(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id       UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question      TEXT NOT NULL,
  options       JSONB NOT NULL DEFAULT '[]',   -- array of strings
  correct_index INTEGER NOT NULL DEFAULT 0,
  explanation   TEXT,
  position      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id      UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers      JSONB NOT NULL DEFAULT '[]',    -- array of chosen indexes (null = skipped)
  score        INTEGER NOT NULL DEFAULT 0,
  total        INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: study_tasks
-- =============================================================

CREATE TABLE IF NOT EXISTS study_tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  subject          TEXT,
  priority         task_priority NOT NULL DEFAULT 'medium',
  status           task_status NOT NULL DEFAULT 'todo',
  due_at           TIMESTAMPTZ,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  completed_at     TIMESTAMPTZ,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: activity_log
-- Single source of truth for XP, streaks, level and the
-- dashboard "Recent activity" feed. Every feature writes here.
-- =============================================================

CREATE TABLE IF NOT EXISTS activity_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  label         TEXT NOT NULL,
  metadata      JSONB NOT NULL DEFAULT '{}',
  xp            INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: notifications
-- =============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  link       TEXT,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: user_settings
-- =============================================================

CREATE TABLE IF NOT EXISTS user_settings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  theme                TEXT NOT NULL DEFAULT 'dark',
  daily_goal_minutes   INTEGER NOT NULL DEFAULT 60,
  email_notifications  BOOLEAN NOT NULL DEFAULT true,
  push_notifications   BOOLEAN NOT NULL DEFAULT false,
  study_reminders      BOOLEAN NOT NULL DEFAULT true,
  public_profile       BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- INDEXES
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_notes_user_id        ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_subject        ON notes(subject);
CREATE INDEX IF NOT EXISTS idx_notes_updated        ON notes(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_decks_user_id        ON flashcard_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id   ON flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id   ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_due       ON flashcards(user_id, due_at);

CREATE INDEX IF NOT EXISTS idx_quizzes_user_id      ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id    ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_id     ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz_id     ON quiz_attempts(quiz_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id        ON study_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status         ON study_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due            ON study_tasks(due_at);

CREATE INDEX IF NOT EXISTS idx_activity_user_time   ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_type        ON activity_log(user_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id, created_at DESC);

-- =============================================================
-- UPDATED_AT TRIGGERS
-- =============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'notes', 'flashcard_decks', 'flashcards', 'quizzes',
    'study_tasks', 'user_settings', 'profiles'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_updated_at ON %I', t, t);
    EXECUTE format(
      'CREATE TRIGGER %I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t, t
    );
  END LOOP;
END $$;

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE notes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_decks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;

-- Own-row policies. Written with DROP-then-CREATE so this file is
-- re-runnable without "policy already exists" errors.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'notes', 'flashcard_decks', 'flashcards', 'quizzes',
    'quiz_questions', 'quiz_attempts', 'study_tasks',
    'activity_log', 'notifications'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_own_select ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_own_insert ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_own_update ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_own_delete ON %I', t, t);

    EXECUTE format(
      'CREATE POLICY %I_own_select ON %I FOR SELECT USING (user_id = auth.uid())', t, t);
    EXECUTE format(
      'CREATE POLICY %I_own_insert ON %I FOR INSERT WITH CHECK (user_id = auth.uid())', t, t);
    EXECUTE format(
      'CREATE POLICY %I_own_update ON %I FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', t, t);
    EXECUTE format(
      'CREATE POLICY %I_own_delete ON %I FOR DELETE USING (user_id = auth.uid())', t, t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS user_settings_own_select ON user_settings;
DROP POLICY IF EXISTS user_settings_own_insert ON user_settings;
DROP POLICY IF EXISTS user_settings_own_update ON user_settings;
CREATE POLICY user_settings_own_select ON user_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_settings_own_insert ON user_settings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY user_settings_own_update ON user_settings FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS profiles_own_select ON profiles;
DROP POLICY IF EXISTS profiles_own_insert ON profiles;
DROP POLICY IF EXISTS profiles_own_update ON profiles;
CREATE POLICY profiles_own_select ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY profiles_own_insert ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY profiles_own_update ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- =============================================================
-- GRANTS
-- The pre-existing tutor/RAG tables were missing table-level
-- privileges for the PostgREST roles, which surfaced as
-- 42501 "permission denied for table ...". RLS above still
-- confines every role to its own rows.
-- =============================================================

-- service_role is included because migration 001 gates scholarship
-- writes behind USING (auth.role() = 'service_role'), which can never
-- match while service_role holds no table privileges. It bypasses RLS,
-- so it must stay server-side only.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Guarded by existence check: chats/messages/documents/document_chunks were
-- created outside the migrations folder, so a missing one must not abort the
-- whole file.
DO $$
DECLARE
  t TEXT;
  readwrite TEXT[] := ARRAY[
    'notes', 'flashcard_decks', 'flashcards', 'quizzes', 'quiz_questions',
    'quiz_attempts', 'study_tasks', 'activity_log', 'notifications',
    'user_settings', 'profiles', 'chats', 'messages', 'documents',
    'document_chunks', 'saved_scholarships', 'scholarship_applications',
    'student_scholarship_profiles'
  ];
  readonly TEXT[] := ARRAY[
    'scholarships', 'scholarship_requirements',
    'scholarship_documents', 'scholarship_sources'
  ];
BEGIN
  FOREACH t IN ARRAY readwrite
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = t AND c.relkind = 'r'
    ) THEN
      EXECUTE format(
        'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO anon, authenticated, service_role', t
      );
    END IF;
  END LOOP;

  FOREACH t IN ARRAY readonly
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = t AND c.relkind = 'r'
    ) THEN
      EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon, authenticated, service_role', t);
    END IF;
  END LOOP;
END $$;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- The RAG similarity search RPC. It already exists in this
-- project; only the execute privilege was missing. Resolved by
-- name rather than by exact signature so a differing argument
-- list cannot abort the migration.
DO $$
DECLARE
  f RECORD;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'match_document_chunks'
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated, service_role', f.sig);
  END LOOP;
END $$;

-- =============================================================
-- FUNCTION: get_user_dashboard_stats
-- One round-trip for the dashboard stat cards and analytics.
-- XP/level/streak are all derived from activity_log so they can
-- never drift out of sync with what the user actually did.
-- =============================================================

CREATE OR REPLACE FUNCTION get_user_dashboard_stats(target_user_id UUID)
RETURNS TABLE (
  total_xp            BIGINT,
  level               INTEGER,
  streak_days         INTEGER,
  ai_usage            BIGINT,
  notes_count         BIGINT,
  decks_count         BIGINT,
  cards_due           BIGINT,
  tasks_done          BIGINT,
  tasks_open          BIGINT,
  quizzes_taken       BIGINT,
  avg_accuracy        NUMERIC,
  minutes_this_week   BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_day  DATE;
  v_streak    INTEGER := 0;
BEGIN
  SELECT COALESCE(SUM(xp), 0) INTO total_xp
  FROM activity_log WHERE user_id = target_user_id;

  -- 1000 XP per level, floor of 1.
  level := GREATEST(1, FLOOR(total_xp::numeric / 1000) + 1)::integer;

  SELECT COUNT(*) INTO ai_usage
  FROM activity_log
  WHERE user_id = target_user_id AND activity_type = 'tutor';

  SELECT COUNT(*) INTO notes_count FROM notes WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO decks_count FROM flashcard_decks WHERE user_id = target_user_id;

  SELECT COUNT(*) INTO cards_due
  FROM flashcards WHERE user_id = target_user_id AND due_at <= NOW();

  SELECT COUNT(*) INTO tasks_done
  FROM study_tasks WHERE user_id = target_user_id AND status = 'done';

  SELECT COUNT(*) INTO tasks_open
  FROM study_tasks WHERE user_id = target_user_id AND status <> 'done';

  SELECT COUNT(*), COALESCE(ROUND(AVG(score::numeric / NULLIF(total, 0) * 100), 1), 0)
  INTO quizzes_taken, avg_accuracy
  FROM quiz_attempts WHERE user_id = target_user_id;

  -- activity_log has no duration column; study time lives in the
  -- JSONB metadata written by logActivity().
  SELECT COALESCE(SUM((a.metadata ->> 'minutes')::bigint), 0)
  INTO minutes_this_week
  FROM activity_log a
  WHERE a.user_id = target_user_id
    AND a.created_at >= date_trunc('week', NOW())
    AND a.metadata ->> 'minutes' ~ '^[0-9]+$';

  -- Streak: consecutive days ending today or yesterday.
  SELECT MAX(created_at::date) INTO v_last_day
  FROM activity_log WHERE user_id = target_user_id;

  IF v_last_day IS NOT NULL AND v_last_day >= CURRENT_DATE - 1 THEN
    SELECT COUNT(*)::integer INTO v_streak
    FROM (
      SELECT created_at::date AS d,
             created_at::date - (ROW_NUMBER() OVER (ORDER BY created_at::date))::integer AS grp
      FROM (SELECT DISTINCT created_at::date FROM activity_log WHERE user_id = target_user_id) dd
    ) grouped
    WHERE grouped.grp = (
      SELECT g2.grp FROM (
        SELECT created_at::date AS d,
               created_at::date - (ROW_NUMBER() OVER (ORDER BY created_at::date))::integer AS grp
        FROM (SELECT DISTINCT created_at::date FROM activity_log WHERE user_id = target_user_id) d3
      ) g2 WHERE g2.d = v_last_day
    );
  END IF;

  streak_days := v_streak;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_dashboard_stats(uuid) TO anon, authenticated, service_role;

-- =============================================================
-- FUNCTION: get_weekly_study_minutes
-- Bar chart data for the dashboard and analytics pages.
-- =============================================================

CREATE OR REPLACE FUNCTION get_weekly_study_minutes(target_user_id UUID)
RETURNS TABLE (day TEXT, day_index INTEGER, minutes BIGINT, xp BIGINT, events BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH week AS (
    SELECT generate_series(0, 6) AS offset
  ),
  days AS (
    SELECT
      to_char(CURRENT_DATE - (6 - w.offset) * INTERVAL '1 day', 'Dy') AS day,
      w.offset AS day_index,
      (CURRENT_DATE - (6 - w.offset)) AS d
    FROM week w
  )
  SELECT
    days.day,
    days.day_index::integer,
    COALESCE(SUM((a.metadata ->> 'minutes')::bigint), 0)::bigint AS minutes,
    COALESCE(SUM(a.xp), 0)::bigint AS xp,
    COUNT(a.id)::bigint AS events
  FROM days
  LEFT JOIN activity_log a
    ON a.user_id = target_user_id AND a.created_at::date = days.d
  GROUP BY days.day, days.day_index
  ORDER BY days.day_index;
$$;

GRANT EXECUTE ON FUNCTION get_weekly_study_minutes(uuid) TO anon, authenticated, service_role;


-- =============================================================
-- SECTION 11: Scholarship table privileges
-- Migration 001 created these tables without explicit GRANTs,
-- so the anon/authenticated roles can be refused with SQLSTATE
-- 42501 even though the RLS policies allow public reads.
--
-- Reference data stays read-only for the public roles; writes go
-- through service_role, matching the USING (auth.role() =
-- 'service_role') policies in 001. The three user-owned tables
-- need full DML for authenticated users, confined by RLS.
-- Safe to re-run.
-- =============================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'student_scholarship_profiles',
    'saved_scholarships',
    'scholarship_applications'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = t AND c.relkind = 'r'
    ) THEN
      EXECUTE format(
        'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO anon, authenticated, service_role',
        t
      );
    END IF;
  END LOOP;

  FOREACH t IN ARRAY ARRAY[
    'scholarships',
    'scholarship_requirements',
    'scholarship_documents',
    'scholarship_sources'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = t AND c.relkind = 'r'
    ) THEN
      EXECUTE format(
        'GRANT SELECT ON TABLE public.%I TO anon, authenticated', t
      );
      EXECUTE format(
        'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO service_role', t
      );
    END IF;
  END LOOP;
END $$;
