import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getStudentProfile,
  getScholarshipsWithRequirements,
  getSavedScholarshipIds,
} from "@/lib/scholarships/query";
import { matchAll } from "@/lib/scholarships/matching";
import { serverError } from "@/lib/api/guard";
import { limitOrNull } from "@/lib/api/rateLimit";

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const limited = await limitOrNull("scholarships_matches", user.id, 120);
  if (limited) return limited;

  try {
    // Fetch student profile
    const profileResult = await getStudentProfile(user.id);
    if (profileResult.error) {
      return serverError("GET /api/scholarships/matches", profileResult.error, "Could not load your matches.", profileResult.error.code);
    }

    if (!profileResult.data) {
      return NextResponse.json(
        {
          data: [],
          meta: { profile_complete: false },
          error: null,
        },
        { status: 200 }
      );
    }

    // Fetch all active scholarships with requirements
    const scholarships = await getScholarshipsWithRequirements();
    const savedIds = await getSavedScholarshipIds(user.id);

    // Run deterministic matching
    const matched = matchAll(scholarships, profileResult.data);

    // Shape response — include summary fields + match result
    const results = matched.map(({ scholarship, match }) => ({
      id: scholarship.id,
      name: scholarship.name,
      slug: scholarship.slug,
      provider_name: scholarship.provider_name,
      university_name: scholarship.university_name,
      country_code: scholarship.country_code,
      country_name: scholarship.country_name,
      degree_levels: scholarship.degree_levels,
      fields: scholarship.fields,
      funding_type: scholarship.funding_type,
      status: scholarship.status,
      application_deadline: scholarship.application_deadline,
      official_source_url: scholarship.official_source_url,
      last_verified_at: scholarship.last_verified_at,
      is_saved: savedIds.includes(scholarship.id),
      match,
    }));

    return NextResponse.json(
      {
        data: results,
        meta: { profile_complete: true, total: results.length },
        error: null,
      },
      { status: 200 }
    );
  } catch (error) {
    return serverError("GET /api/scholarships/matches", error, "Could not load your matches.");
  }
}
