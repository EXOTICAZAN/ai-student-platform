import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getScholarships } from "@/lib/scholarships/query";
import { clampInt, serverError } from "@/lib/api/guard";
import type { ScholarshipFilters } from "@/lib/scholarships/types";
import { limitOrNull } from "@/lib/api/rateLimit";

export async function GET(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const limited = await limitOrNull("scholarships_list", user.id, 120);
  if (limited) return limited;

  const { searchParams } = request.nextUrl;

  const q = searchParams.get("q")?.trim() || undefined;

  const filters: ScholarshipFilters = {
    q:            q ? q.slice(0, 200) : undefined,
    country:      searchParams.get("country") ?? undefined,
    degree:       searchParams.get("degree") ?? undefined,
    field:        searchParams.get("field") ?? undefined,
    funding:      (searchParams.get("funding") as ScholarshipFilters["funding"]) ?? undefined,
    status:       (searchParams.get("status") as ScholarshipFilters["status"]) ?? undefined,
    deadline_from: searchParams.get("deadline_from") ?? undefined,
    deadline_to:   searchParams.get("deadline_to") ?? undefined,
    page:         clampInt(searchParams.get("page"), 1, 100_000, 1),
    page_size:    clampInt(searchParams.get("page_size"), 1, 50, 12),
  };

  try {
    const result = await getScholarships(filters);

    if (result.error) {
      return serverError(
        "GET /api/scholarships",
        result.error,
        "Could not load scholarships.",
        result.error.code
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return serverError("GET /api/scholarships", error, "Could not load scholarships.");
  }
}
