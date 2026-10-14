import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApplications } from "@/lib/scholarships/query";
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

  const limited = await limitOrNull("scholarships_apps", user.id, 120);
  if (limited) return limited;


  try {
    const result = await getApplications(user.id);

    if (result.error) {
      return serverError("GET /api/scholarships/applications", result.error, "Could not load your applications.", result.error.code);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return serverError("GET /api/scholarships/applications", error, "Could not load your applications.");
  }
}
