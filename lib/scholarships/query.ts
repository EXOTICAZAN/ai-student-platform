import { createClient } from "@/lib/supabase/server";
import { statusFilterClause, withEffectiveStatus } from "./status";
import type {
  ScholarshipFilters,
  ScholarshipSummary,
  ScholarshipDetail,
  StudentScholarshipProfile,
  ScholarshipApplicationRow,
  ApiResponse,
} from "./types";

/**
 * Postgres messages name tables, columns and constraints. They are logged in
 * full here and replaced with a generic string before a route can return them.
 */
function dbError(
  context: string,
  error: { message?: string } | null | undefined,
  fallback = "A database error occurred."
) {
  // `.single()` reports a legitimately absent row as an error too; that is a
  // normal 404, not something to page anyone about.
  if (error) console.error(`[scholarships] ${context}:`, error.message ?? error);
  return { code: "DB_ERROR", message: fallback };
}


// ------------------------------------------------------------------
// Catalog — paginated list with optional search and filters
// ------------------------------------------------------------------

export async function getScholarships(
  filters: ScholarshipFilters = {}
): Promise<ApiResponse<ScholarshipSummary[]>> {
  const supabase = await createClient();

  const {
    q,
    country,
    degree,
    field,
    funding,
    status,
    deadline_from,
    deadline_to,
    page = 1,
    page_size = 12,
  } = filters;

  const offset = (page - 1) * page_size;

  let query = supabase
    .from("scholarships")
    .select(
      `id, name, slug, provider_name, university_name,
       country_code, country_name, degree_levels, fields,
       funding_type, status, application_deadline,
       official_source_url, last_verified_at`,
      { count: "exact" }
    )
    .eq("is_active", true);

  // Text search
  if (q?.trim()) {
    query = query.textSearch(
      "fts",
      q.trim().split(" ").join(" & "),
      { type: "plain", config: "english" }
    );
  }

  // Structured filters
  if (country) query = query.eq("country_code", country);
  if (funding) query = query.eq("funding_type", funding);
  if (status) {
    const clause = statusFilterClause(status);
    if (clause.eq) query = query.eq("status", clause.eq);
    query = query.or(clause.or);
  }

  // Degree filter — check JSONB array contains the value
  if (degree) {
    query = query.contains("degree_levels", JSON.stringify([degree]));
  }

  // Field filter — partial match inside fields array
  if (field) {
    query = query.contains("fields", JSON.stringify([field]));
  }

  // Deadline range
  if (deadline_from) {
    query = query.gte("application_deadline", deadline_from);
  }
  if (deadline_to) {
    query = query.lte("application_deadline", deadline_to);
  }

  // Sort: open first, then by deadline ascending (nulls last), then by name
  query = query
    .order("status", { ascending: true })  // open sorts before unknown/upcoming/closed alphabetically → handled client side
    .order("application_deadline", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true })
    .range(offset, offset + page_size - 1);

  const { data, error, count } = await query;

  if (error) {
    return {
      data: null,
      error: dbError("getScholarships", error, "Could not load scholarships."),
    };
  }

  return {
    data: ((data ?? []) as ScholarshipSummary[]).map((s) => withEffectiveStatus(s)),
    meta: {
      page,
      pageSize: page_size,
      total: count ?? 0,
    },
    error: null,
  };
}

// ------------------------------------------------------------------
// Single scholarship detail (by slug or UUID)
// ------------------------------------------------------------------

export async function getScholarshipDetail(
  idOrSlug: string
): Promise<ApiResponse<ScholarshipDetail>> {
  const supabase = await createClient();

  // Determine if the param is a UUID or a slug
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug
    );

  const query = supabase
    .from("scholarships")
    .select(
      `*, 
       requirements:scholarship_requirements(*),
       documents:scholarship_documents(*),
       sources:scholarship_sources(*)`
    )
    .eq("is_active", true);

  const { data, error } = isUUID
    ? await query.eq("id", idOrSlug).single()
    : await query.eq("slug", idOrSlug).single();

  if (error || !data) {
    return {
      data: null,
      error: {
        ...dbError("getScholarshipDetail", error, "Scholarship not found"),
        code: "NOT_FOUND",
      },
    };
  }

  return { data: withEffectiveStatus(data as ScholarshipDetail), error: null };
}

// ------------------------------------------------------------------
// Saved scholarships for authenticated user
// ------------------------------------------------------------------

export async function getSavedScholarshipIds(
  userId: string
): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_scholarships")
    .select("scholarship_id")
    .eq("user_id", userId);
  return (data ?? []).map((r) => r.scholarship_id);
}

export async function getSavedScholarships(
  userId: string
): Promise<ApiResponse<ScholarshipSummary[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("saved_scholarships")
    .select(
      `created_at,
       scholarship:scholarships(
         id, name, slug, provider_name, university_name,
         country_code, country_name, degree_levels, fields,
         funding_type, status, application_deadline,
         official_source_url, last_verified_at
       )`
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: dbError("getSavedScholarships", error, "Could not load saved scholarships."),
    };
  }

  const scholarships = (data ?? [])
    .flatMap((r) => {
      const s = r.scholarship;
      if (!s || Array.isArray(s)) return [];
      return [withEffectiveStatus(s as unknown as ScholarshipSummary)];
    });

  return { data: scholarships, error: null };
}

// ------------------------------------------------------------------
// Save / unsave a scholarship
// ------------------------------------------------------------------

export async function saveScholarship(
  userId: string,
  scholarshipId: string
): Promise<ApiResponse<{ saved: true }>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("saved_scholarships")
    .insert({ user_id: userId, scholarship_id: scholarshipId });

  if (error) {
    return {
      data: null,
      error: dbError("saveScholarship", error, "Could not save the scholarship."),
    };
  }

  return { data: { saved: true }, error: null };
}

export async function unsaveScholarship(
  userId: string,
  scholarshipId: string
): Promise<ApiResponse<{ saved: false }>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("saved_scholarships")
    .delete()
    .eq("user_id", userId)
    .eq("scholarship_id", scholarshipId);

  if (error) {
    return {
      data: null,
      error: dbError("unsaveScholarship", error, "Could not remove the saved scholarship."),
    };
  }

  return { data: { saved: false }, error: null };
}

// ------------------------------------------------------------------
// Student scholarship profile
// ------------------------------------------------------------------

export async function getStudentProfile(
  userId: string
): Promise<ApiResponse<StudentScholarshipProfile | null>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("student_scholarship_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return {
      data: null,
      error: dbError("getStudentProfile", error, "Could not load your profile."),
    };
  }

  return { data: data as StudentScholarshipProfile | null, error: null };
}

export async function upsertStudentProfile(
  userId: string,
  profile: Partial<StudentScholarshipProfile>
): Promise<ApiResponse<StudentScholarshipProfile>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("student_scholarship_profiles")
    .upsert(
      { ...profile, user_id: userId },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error || !data) {
    return {
      data: null,
      error: {
        ...dbError("upsertStudentProfile", error, "Could not save your profile."),
      },
    };
  }

  return { data: data as StudentScholarshipProfile, error: null };
}

// ------------------------------------------------------------------
// Application tracker
// ------------------------------------------------------------------

export async function getApplications(
  userId: string
): Promise<ApiResponse<(ScholarshipApplicationRow & { scholarship: ScholarshipSummary })[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("scholarship_applications")
    .select(
      `*,
       scholarship:scholarships(
         id, name, slug, provider_name, country_name,
         funding_type, status, application_deadline, official_source_url
       )`
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: dbError("getApplications", error, "Could not load your applications."),
    };
  }

  const rows = data as (ScholarshipApplicationRow & { scholarship: ScholarshipSummary })[];
  return {
    data: rows.map((row) => ({
      ...row,
      scholarship: row.scholarship ? withEffectiveStatus(row.scholarship) : row.scholarship,
    })),
    error: null,
  };
}

export async function upsertApplication(
  userId: string,
  scholarshipId: string,
  payload: {
    status: string;
    notes?: string;
    checklist_json?: unknown[];
    submitted_at?: string | null;
  }
): Promise<ApiResponse<ScholarshipApplicationRow>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("scholarship_applications")
    .upsert(
      {
        user_id: userId,
        scholarship_id: scholarshipId,
        ...payload,
      },
      { onConflict: "user_id,scholarship_id" }
    )
    .select()
    .single();

  if (error || !data) {
    return {
      data: null,
      error: {
        ...dbError("upsertApplication", error, "Could not save the application."),
      },
    };
  }

  return { data: data as ScholarshipApplicationRow, error: null };
}

// ------------------------------------------------------------------
// Get scholarships for matching (with requirements)
// ------------------------------------------------------------------

export async function getScholarshipsWithRequirements(
  ids?: string[]
): Promise<ScholarshipDetail[]> {
  const supabase = await createClient();

  let query = supabase
    .from("scholarships")
    .select(`*, requirements:scholarship_requirements(*)`)
    .eq("is_active", true);

  if (ids && ids.length > 0) {
    query = query.in("id", ids);
  }

  const { data, error } = await query;

  // Returning [] on failure would make a database outage indistinguishable
  // from "you match nothing", which the matches endpoint reports as success.
  if (error) {
    console.error("[scholarships] getScholarshipsWithRequirements:", error.message);
    throw new Error("Could not load scholarships");
  }

  return (data ?? []) as ScholarshipDetail[];
}

// ------------------------------------------------------------------
// Get list of unique country codes (for filter dropdown)
// ------------------------------------------------------------------

export async function getDistinctCountries(): Promise<
  { country_code: string; country_name: string }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("scholarships")
    .select("country_code, country_name")
    .eq("is_active", true)
    .order("country_name", { ascending: true });

  if (!data) return [];

  // Deduplicate
  const seen = new Set<string>();
  return data.filter((r) => {
    if (seen.has(r.country_code)) return false;
    seen.add(r.country_code);
    return true;
  });
}
