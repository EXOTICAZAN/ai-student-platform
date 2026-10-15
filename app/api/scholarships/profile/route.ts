import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStudentProfile, upsertStudentProfile } from "@/lib/scholarships/query";
import { z } from "zod";
import { limitOrNull } from "@/lib/api/rateLimit";

const ProfileSchema = z.object({
  nationality:         z.string().min(2).max(10).optional(),
  nationality_name:    z.string().max(100).optional(),
  date_of_birth:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  education_level:     z.enum(["high_school", "bachelor", "master", "phd"]).optional(),
  academic_score:      z.number().min(0).max(10000).nullable().optional(),
  academic_score_type: z.enum(["gpa_4", "gpa_5", "gpa_10", "percentage", "cgpa_10"]).optional(),
  intended_degree:     z.enum(["bachelor", "master", "phd"]).optional(),
  intended_field:      z.string().max(200).optional(),
  preferred_countries: z.array(z.string().max(10)).max(20).optional(),
  english_level:       z.enum([
    "native", "fluent", "upper_intermediate",
    "intermediate", "basic", "none",
  ]).optional(),
  test_scores_json:    z.record(z.string(), z.number()).optional(),
  graduation_year:     z.number().min(1950).max(2040).nullable().optional(),
  extra_profile_json:  z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const limited = await limitOrNull("scholarships_profile", user.id, 120);
  if (limited) return limited;

  const result = await getStudentProfile(user.id);

  if (result.error) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result, { status: 200 });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const limited = await limitOrNull("scholarships_profile", user.id, 120);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "BAD_REQUEST", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const parsed = ProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues.map((i) => i.message).join(", "),
        },
      },
      { status: 422 }
    );
  }

  const result = await upsertStudentProfile(user.id, parsed.data);

  if (result.error) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result, { status: 200 });
}
