import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getScholarshipDetail, getSavedScholarshipIds } from "@/lib/scholarships/query";
import { serverError } from "@/lib/api/guard";
import { limitOrNull } from "@/lib/api/rateLimit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const limited = await limitOrNull("scholarships_detail", user.id, 120);
  if (limited) return limited;

  const { id } = await params;

  try {
    const result = await getScholarshipDetail(id);

    if (result.error) {
      if (result.error.code === "NOT_FOUND") {
        return NextResponse.json(result, { status: 404 });
      }
      return serverError("GET /api/scholarships/[id]", result.error, "Could not load that scholarship.", result.error.code);
    }

    // Enrich with is_saved
    const savedIds = await getSavedScholarshipIds(user.id);
    const enriched = {
      ...result.data,
      is_saved: savedIds.includes(result.data!.id),
    };

    return NextResponse.json({ data: enriched, error: null }, { status: 200 });
  } catch (error) {
    return serverError("GET /api/scholarships/[id]", error, "Could not load that scholarship.");
  }
}
