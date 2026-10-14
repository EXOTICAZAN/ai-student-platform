-- =============================================================
-- EduForge AI — Scholarship Feature Migration
-- Version: 001
-- Description: Creates all scholarship-related tables, enums,
--              indexes, and Row Level Security policies.
-- =============================================================

-- =============================================================
-- ENUMS
-- =============================================================

DO $$ BEGIN
  CREATE TYPE funding_type AS ENUM (
  'fully_funded',
  'partially_funded',
  'tuition_only',
  'stipend_only',
  'unknown'
);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE scholarship_status AS ENUM (
  'upcoming',
  'open',
  'closed',
  'unknown'
);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM (
  'verified',
  'needs_review',
  'stale',
  'unavailable'
);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE requirement_type AS ENUM (
  'nationality',
  'age',
  'degree',
  'academic_score',
  'field',
  'language',
  'test',
  'residency',
  'graduation_year',
  'documents',
  'other'
);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE student_application_status AS ENUM (
  'saved',
  'planning',
  'applying',
  'submitted',
  'accepted',
  'rejected',
  'withdrawn'
);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================
-- TABLE: scholarships
-- The canonical scholarship catalog. Public read.
-- =============================================================

CREATE TABLE IF NOT EXISTS scholarships (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  slug                 TEXT NOT NULL UNIQUE,
  provider_name        TEXT NOT NULL,
  university_name      TEXT,
  country_code         TEXT NOT NULL,         -- ISO 3166-1 alpha-2, e.g. 'GB', 'DE'
  country_name         TEXT NOT NULL,
  description          TEXT NOT NULL,
  degree_levels        JSONB NOT NULL DEFAULT '[]', -- e.g. ["bachelor", "master", "phd"]
  fields               JSONB NOT NULL DEFAULT '[]', -- e.g. ["Computer Science", "Engineering"]
  funding_type         funding_type NOT NULL DEFAULT 'unknown',
  tuition_coverage     TEXT,
  stipend              TEXT,
  accommodation        TEXT,
  travel_support       TEXT,
  insurance_support    TEXT,
  other_benefits       TEXT,
  application_url      TEXT,
  official_source_url  TEXT NOT NULL,
  application_open_date DATE,
  application_deadline  TIMESTAMPTZ,
  deadline_timezone    TEXT,                  -- e.g. 'UTC', 'Europe/London'
  status               scholarship_status NOT NULL DEFAULT 'unknown',
  source_type          TEXT NOT NULL DEFAULT 'official', -- 'official', 'aggregator', 'manual'
  last_verified_at     TIMESTAMPTZ,
  verified_by          TEXT,
  verification_notes   TEXT,
  is_active            BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: scholarship_requirements
-- Structured eligibility rules for deterministic matching.
-- =============================================================

CREATE TABLE IF NOT EXISTS scholarship_requirements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id   UUID NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  requirement_type requirement_type NOT NULL,
  operator         TEXT NOT NULL DEFAULT 'eq',  -- 'eq', 'in', 'not_in', 'lte', 'gte', 'range'
  value_json       JSONB NOT NULL,               -- flexible value: string, array, number, object
  description      TEXT NOT NULL,               -- human-readable explanation
  required         BOOLEAN NOT NULL DEFAULT true,
  source_reference TEXT,                        -- URL or note proving this requirement
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: scholarship_documents
-- Documents required in the scholarship application.
-- =============================================================

CREATE TABLE IF NOT EXISTS scholarship_documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id UUID NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  document_name  TEXT NOT NULL,
  required       BOOLEAN NOT NULL DEFAULT true,
  notes          TEXT,
  sort_order     INTEGER NOT NULL DEFAULT 0
);

-- =============================================================
-- TABLE: scholarship_sources
-- Source and verification metadata per scholarship.
-- =============================================================

CREATE TABLE IF NOT EXISTS scholarship_sources (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id      UUID NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  url                 TEXT NOT NULL,
  source_type         TEXT NOT NULL DEFAULT 'official',
  title               TEXT,
  last_checked_at     TIMESTAMPTZ,
  verified_at         TIMESTAMPTZ,
  verification_status verification_status NOT NULL DEFAULT 'needs_review',
  notes               TEXT
);

-- =============================================================
-- TABLE: student_scholarship_profiles
-- One row per user. Separate from the general `profiles` table.
-- =============================================================

CREATE TABLE IF NOT EXISTS student_scholarship_profiles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nationality          TEXT,                   -- ISO 3166-1 alpha-2
  nationality_name     TEXT,
  date_of_birth        DATE,
  education_level      TEXT,                   -- 'high_school', 'bachelor', 'master', 'phd'
  academic_score       NUMERIC(5,2),
  academic_score_type  TEXT,                   -- 'gpa_4', 'gpa_5', 'percentage', 'cgpa_10'
  intended_degree      TEXT,                   -- 'bachelor', 'master', 'phd'
  intended_field       TEXT,
  preferred_countries  JSONB NOT NULL DEFAULT '[]',  -- array of country codes
  english_level        TEXT,                   -- 'native', 'fluent', 'upper_intermediate', etc.
  test_scores_json     JSONB NOT NULL DEFAULT '{}',  -- { ielts: 7.5, toefl: 100, gre: 320 }
  graduation_year      INTEGER,
  extra_profile_json   JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: saved_scholarships
-- User bookmarks / saves.
-- =============================================================

CREATE TABLE IF NOT EXISTS saved_scholarships (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scholarship_id UUID NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, scholarship_id)
);

-- =============================================================
-- TABLE: scholarship_applications
-- Application tracking per user per scholarship.
-- =============================================================

CREATE TABLE IF NOT EXISTS scholarship_applications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scholarship_id UUID NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  status         student_application_status NOT NULL DEFAULT 'planning',
  notes          TEXT,
  checklist_json JSONB NOT NULL DEFAULT '[]',
  started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at   TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, scholarship_id)
);

-- =============================================================
-- INDEXES
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_scholarships_country_code    ON scholarships(country_code);
CREATE INDEX IF NOT EXISTS idx_scholarships_status          ON scholarships(status);
CREATE INDEX IF NOT EXISTS idx_scholarships_funding_type    ON scholarships(funding_type);
CREATE INDEX IF NOT EXISTS idx_scholarships_deadline        ON scholarships(application_deadline);
CREATE INDEX IF NOT EXISTS idx_scholarships_is_active       ON scholarships(is_active);
CREATE INDEX IF NOT EXISTS idx_scholarships_slug            ON scholarships(slug);

CREATE INDEX IF NOT EXISTS idx_requirements_scholarship_id  ON scholarship_requirements(scholarship_id);
CREATE INDEX IF NOT EXISTS idx_requirements_type            ON scholarship_requirements(requirement_type);

CREATE INDEX IF NOT EXISTS idx_saved_user_id                ON saved_scholarships(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_scholarship_id         ON saved_scholarships(scholarship_id);

CREATE INDEX IF NOT EXISTS idx_applications_user_id         ON scholarship_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_scholarship_id  ON scholarship_applications(scholarship_id);
CREATE INDEX IF NOT EXISTS idx_applications_status          ON scholarship_applications(status);

-- Full-text search index on scholarships
CREATE INDEX IF NOT EXISTS idx_scholarships_fts ON scholarships USING GIN (
  to_tsvector('english',
    coalesce(name, '') || ' ' ||
    coalesce(provider_name, '') || ' ' ||
    coalesce(university_name, '') || ' ' ||
    coalesce(country_name, '') || ' ' ||
    coalesce(description, '')
  )
);

-- =============================================================
-- UPDATED_AT TRIGGER
-- =============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS scholarships_updated_at ON scholarships;
CREATE TRIGGER scholarships_updated_at
  BEFORE UPDATE ON scholarships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS requirements_updated_at ON scholarship_requirements;
CREATE TRIGGER requirements_updated_at
  BEFORE UPDATE ON scholarship_requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS profile_updated_at ON student_scholarship_profiles;
CREATE TRIGGER profile_updated_at
  BEFORE UPDATE ON student_scholarship_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS applications_updated_at ON scholarship_applications;
CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON scholarship_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

-- Enable RLS on all tables
ALTER TABLE scholarships                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_requirements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_documents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_sources            ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_scholarship_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_scholarships             ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_applications       ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- scholarships: public read of active records
-- ---------------------------------------------------------------
-- Drop named policies first so this migration can be safely re-applied.
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('scholarships', 'scholarship_requirements', 'scholarship_documents',
                        'scholarship_sources', 'student_scholarship_profiles',
                        'saved_scholarships', 'scholarship_applications')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

CREATE POLICY "scholarships_public_read"
  ON scholarships FOR SELECT
  USING (is_active = true);

-- Admin write (future-proofed; for now only service_role can write)
CREATE POLICY "scholarships_service_write"
  ON scholarships FOR ALL
  USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------
-- scholarship_requirements: public read (follows parent)
-- ---------------------------------------------------------------
CREATE POLICY "requirements_public_read"
  ON scholarship_requirements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scholarships s
      WHERE s.id = scholarship_requirements.scholarship_id
        AND s.is_active = true
    )
  );

CREATE POLICY "requirements_service_write"
  ON scholarship_requirements FOR ALL
  USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------
-- scholarship_documents: public read
-- ---------------------------------------------------------------
CREATE POLICY "documents_public_read"
  ON scholarship_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scholarships s
      WHERE s.id = scholarship_documents.scholarship_id
        AND s.is_active = true
    )
  );

CREATE POLICY "documents_service_write"
  ON scholarship_documents FOR ALL
  USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------
-- scholarship_sources: public read
-- ---------------------------------------------------------------
CREATE POLICY "sources_public_read"
  ON scholarship_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scholarships s
      WHERE s.id = scholarship_sources.scholarship_id
        AND s.is_active = true
    )
  );

CREATE POLICY "sources_service_write"
  ON scholarship_sources FOR ALL
  USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------
-- student_scholarship_profiles: own row only
-- ---------------------------------------------------------------
CREATE POLICY "profile_own_select"
  ON student_scholarship_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "profile_own_insert"
  ON student_scholarship_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "profile_own_update"
  ON student_scholarship_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------
-- saved_scholarships: own rows only
-- ---------------------------------------------------------------
CREATE POLICY "saved_own_select"
  ON saved_scholarships FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "saved_own_insert"
  ON saved_scholarships FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "saved_own_delete"
  ON saved_scholarships FOR DELETE
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------
-- scholarship_applications: own rows only
-- ---------------------------------------------------------------
CREATE POLICY "applications_own_select"
  ON scholarship_applications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "applications_own_insert"
  ON scholarship_applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "applications_own_update"
  ON scholarship_applications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
