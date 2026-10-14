// =============================================================
// EduForge AI — Scholarship Feature Types
// =============================================================

// ------------------------------------------------------------------
// Enums (mirrors the SQL enums)
// ------------------------------------------------------------------

export type FundingType =
  | "fully_funded"
  | "partially_funded"
  | "tuition_only"
  | "stipend_only"
  | "unknown";

export type ScholarshipStatus = "upcoming" | "open" | "closed" | "unknown";

export type VerificationStatus =
  | "verified"
  | "needs_review"
  | "stale"
  | "unavailable";

export type RequirementType =
  | "nationality"
  | "age"
  | "degree"
  | "academic_score"
  | "field"
  | "language"
  | "test"
  | "residency"
  | "graduation_year"
  | "documents"
  | "other";

export type StudentApplicationStatus =
  | "saved"
  | "planning"
  | "applying"
  | "submitted"
  | "accepted"
  | "rejected"
  | "withdrawn";

// ------------------------------------------------------------------
// Database row types (raw Supabase return)
// ------------------------------------------------------------------

export interface ScholarshipRow {
  id: string;
  name: string;
  slug: string;
  provider_name: string;
  university_name: string | null;
  country_code: string;
  country_name: string;
  description: string;
  degree_levels: string[];
  fields: string[];
  funding_type: FundingType;
  tuition_coverage: string | null;
  stipend: string | null;
  accommodation: string | null;
  travel_support: string | null;
  insurance_support: string | null;
  other_benefits: string | null;
  application_url: string | null;
  official_source_url: string;
  application_open_date: string | null;
  application_deadline: string | null;
  deadline_timezone: string | null;
  status: ScholarshipStatus;
  source_type: string;
  last_verified_at: string | null;
  verified_by: string | null;
  verification_notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RequirementRow {
  id: string;
  scholarship_id: string;
  requirement_type: RequirementType;
  operator: string;
  value_json: unknown;
  description: string;
  required: boolean;
  source_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentRow {
  id: string;
  scholarship_id: string;
  document_name: string;
  required: boolean;
  notes: string | null;
  sort_order: number;
}

export interface SourceRow {
  id: string;
  scholarship_id: string;
  url: string;
  source_type: string;
  title: string | null;
  last_checked_at: string | null;
  verified_at: string | null;
  verification_status: VerificationStatus;
  notes: string | null;
}

export interface StudentScholarshipProfileRow {
  id: string;
  user_id: string;
  nationality: string | null;
  nationality_name: string | null;
  date_of_birth: string | null;
  education_level: string | null;
  academic_score: number | null;
  academic_score_type: string | null;
  intended_degree: string | null;
  intended_field: string | null;
  preferred_countries: string[];
  english_level: string | null;
  test_scores_json: Record<string, number>;
  graduation_year: number | null;
  extra_profile_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SavedScholarshipRow {
  id: string;
  user_id: string;
  scholarship_id: string;
  created_at: string;
}

export interface ScholarshipApplicationRow {
  id: string;
  user_id: string;
  scholarship_id: string;
  status: StudentApplicationStatus;
  notes: string | null;
  checklist_json: ChecklistItem[];
  started_at: string;
  submitted_at: string | null;
  updated_at: string;
}

// ------------------------------------------------------------------
// Domain types (enriched, for UI consumption)
// ------------------------------------------------------------------

/** Lightweight card for catalog grid */
export interface ScholarshipSummary {
  id: string;
  name: string;
  slug: string;
  provider_name: string;
  university_name: string | null;
  country_code: string;
  country_name: string;
  degree_levels: string[];
  fields: string[];
  funding_type: FundingType;
  status: ScholarshipStatus;
  application_deadline: string | null;
  official_source_url: string;
  last_verified_at: string | null;
  is_saved?: boolean;
  match?: MatchResult | null;
}

/** Full scholarship detail (with requirements, documents, sources) */
export interface ScholarshipDetail extends ScholarshipRow {
  requirements: RequirementRow[];
  documents: DocumentRow[];
  sources: SourceRow[];
  is_saved?: boolean;
  match?: MatchResult | null;
  application?: ScholarshipApplicationRow | null;
}

// ------------------------------------------------------------------
// Student profile (domain type, mirrors the Row but typed)
// ------------------------------------------------------------------

export interface StudentScholarshipProfile {
  id?: string;
  user_id?: string;
  nationality: string;
  nationality_name: string;
  date_of_birth: string;
  education_level: string;
  academic_score: number | null;
  academic_score_type: string;
  intended_degree: string;
  intended_field: string;
  preferred_countries: string[];
  english_level: string;
  test_scores_json: Record<string, number>;
  graduation_year: number | null;
  extra_profile_json: Record<string, unknown>;
}

// ------------------------------------------------------------------
// Matching Engine types
// ------------------------------------------------------------------

export type RequirementEval = "PASS" | "FAIL" | "UNKNOWN" | "REVIEW";

export interface RequirementResult {
  requirement_id: string;
  requirement_type: RequirementType;
  description: string;
  eval: RequirementEval;
  reason: string;
  required: boolean;
}

export type MatchCategory =
  | "strong_match"
  | "possible_match"
  | "low_match"
  | "not_eligible"
  | "no_profile";

export interface MatchResult {
  score: number;                       // 0–100
  category: MatchCategory;
  requirement_results: RequirementResult[];
  strong_matches: RequirementResult[];
  potential_issues: RequirementResult[];
  missing_info: RequirementResult[];
  failed_mandatory: RequirementResult[];
}

// ------------------------------------------------------------------
// Checklist item (used in scholarship_applications.checklist_json)
// ------------------------------------------------------------------

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

// ------------------------------------------------------------------
// API response shapes
// ------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T | null;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
  error: {
    code: string;
    message: string;
  } | null;
}

// ------------------------------------------------------------------
// Search / filter params
// ------------------------------------------------------------------

export interface ScholarshipFilters {
  q?: string;
  country?: string;
  degree?: string;
  field?: string;
  funding?: FundingType | "";
  status?: ScholarshipStatus | "";
  deadline_from?: string;
  deadline_to?: string;
  page?: number;
  page_size?: number;
}

// ------------------------------------------------------------------
// AI Advisor
// ------------------------------------------------------------------

export interface AIAdvisorRequest {
  question: string;
  scholarship_ids?: string[];
}

export interface AIAdvisorResponse {
  recommendation: string;
  why_it_matches: string[];
  potential_issues: string[];
  missing_info: string[];
  official_sources: { name: string; url: string }[];
  disclaimer: string;
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

export const FUNDING_TYPE_LABELS: Record<FundingType, string> = {
  fully_funded: "Fully Funded",
  partially_funded: "Partially Funded",
  tuition_only: "Tuition Only",
  stipend_only: "Stipend Only",
  unknown: "Unknown",
};

export const STATUS_LABELS: Record<ScholarshipStatus, string> = {
  upcoming: "Opening Soon",
  open: "Open",
  closed: "Closed",
  unknown: "Status Unknown",
};

export const APPLICATION_STATUS_LABELS: Record<StudentApplicationStatus, string> = {
  saved: "Saved",
  planning: "Planning",
  applying: "Applying",
  submitted: "Submitted",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const DEGREE_LEVEL_LABELS: Record<string, string> = {
  bachelor: "Bachelor's",
  master: "Master's",
  phd: "PhD",
  research: "Research",
};
