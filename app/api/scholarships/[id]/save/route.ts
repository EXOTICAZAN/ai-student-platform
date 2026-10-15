import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveScholarship, unsaveScholarship } from "@/lib/scholarships/query";
import { isUuid, serverError } from "@/lib/api/guard";
import { limitOrNull } from "@/lib/api/rateLimit";

function unauthorized() {
  return NextResponse.json(
    { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
    { status: 401 }
  );
}

function badId() {
  return NextResponse.json(
    { data: null, error: { code: "BAD_REQUEST", message: "A valid scholarship id is required" } },
    { status: 400 }
  );
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return unauthorized();
  const limited = await limitOrNull("scholarships_save", user.id, 120);
  if (limited) return limited;

  const { id } = await params;
  if (!isUuid(id)) return badId();

  try {
    const result = await saveScholarship(user.id, id);

    if (result.error) {
      // Duplicate save is not an error — treat as idempotent
      if (result.error.message?.includes("duplicate") || result.error.message?.includes("unique")) {
        return NextResponse.json({ data: { saved: true }, error: null }, { status: 200 });
      }
      return serverError("POST /api/scholarships/[id]/save", result.error, "Could not save the scholarship.", result.error.code);
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return serverError("POST /api/scholarships/[id]/save", error, "Could not save the scholarship.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return unauthorized();
  const limited = await limitOrNull("scholarships_save", user.id, 120);
  if (limited) return limited;

  const { id } = await params;
  if (!isUuid(id)) return badId();

  try {
    const result = await unsaveScholarship(user.id, id);

    if (result.error) {
      return serverError("DELETE /api/scholarships/[id]/save", result.error, "Could not remove the saved scholarship.", result.error.code);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return serverError("DELETE /api/scholarships/[id]/save", error, "Could not remove the saved scholarship.");
  }
}
