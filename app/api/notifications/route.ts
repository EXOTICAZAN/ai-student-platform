import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { limitOrNull } from "@/lib/api/rateLimit";
import { isUuid } from "@/lib/api/guard";

// =============================================================
// /api/notifications
// GET  — the signed-in user's notifications plus an unread count
// POST — mark one ({ id }) or all ({}) notifications as read
// =============================================================

const LIMIT = 20;

async function currentUser() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return { supabase, user: session?.user ?? null };
}

function unauthorized() {
  return NextResponse.json(
    { data: null, error: { code: "unauthorized", message: "Sign in required." } },
    { status: 401 }
  );
}

export async function GET() {
  try {
    const { supabase, user } = await currentUser();
    if (!user) return unauthorized();
    const limited = await limitOrNull("notifications", user.id, 120);
    if (limited) return limited;

    const [list, count] = await Promise.all([
      supabase
        .from("notifications")
        .select("id, text, link, read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(LIMIT),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false),
    ]);

    return NextResponse.json({
      data: { notifications: list.data ?? [], unread: count.count ?? 0 },
    });
  } catch (error) {
    console.error("[notifications] GET failed:", error);
    return NextResponse.json(
      { data: null, error: { code: "server_error", message: "Could not load notifications." } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await currentUser();
    if (!user) return unauthorized();
    const limited = await limitOrNull("notifications", user.id, 120);
    if (limited) return limited;

    const body = (await request.json().catch(() => ({}))) as { id?: unknown };

    // A non-UUID id would reach a uuid column and fail inside Postgres.
    if (body.id !== undefined && !isUuid(body.id)) {
      return NextResponse.json(
        { data: null, error: { code: "invalid_request", message: "A valid notification id is required." } },
        { status: 400 }
      );
    }

    let query = supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (body.id) query = query.eq("id", body.id);

    const { error } = await query.select("id");

    if (error) {
      console.error("[notifications] POST failed:", error.message);
      return NextResponse.json(
        { data: null, error: { code: "update_failed", message: "Could not update the notification." } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error("[notifications] POST failed:", error);
    return NextResponse.json(
      { data: null, error: { code: "server_error", message: "Could not update notifications." } },
      { status: 500 }
    );
  }
}
