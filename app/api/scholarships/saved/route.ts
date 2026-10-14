import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSavedScholarships } from "@/lib/scholarships/query";
import { serverError } from "@/lib/api/guard";
import { limitOrNull } from "@/lib/api/rateLimit";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const limited = await limitOrNull("scholarships_saved", user.id, 120);
  if (limited) return limited;


  try {
    const result = await getSavedScholarships(user.id);

    if (result.error) {
      return serverError("GET /api/scholarships/saved", result.error, "Could not load saved scholarships.", result.error.code);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return serverError("GET /api/scholarships/saved", error, "Could not load saved scholarships.");
  }
}
