import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateStudyPlan } from "@/lib/study/generate";
import { consume, tooManyRequests } from "@/lib/api/rateLimit";

// =============================================================
// POST /api/planner/generate
//
// Turns a learning goal into a day-by-day study plan. The route
// does NOT persist anything — it returns dated tasks for the
// client to preview, and the user commits via createTasksBulk.
// =============================================================

interface GenerateBody {
  goal?: string;
  subject?: string;
  days?: number;
  minutesPerDay?: number;
  examDate?: string;
  focusAreas?: string[] | string;
}

function clamp(
  value: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.round(n), min), max);
}

const MAX_FOCUS_AREAS = 10;
const MAX_FOCUS_AREA_CHARS = 120;

function parseFocusAreas(value: GenerateBody["focusAreas"]): string[] | undefined {
  let raw: string[] | undefined;
  if (Array.isArray(value)) {
    raw = value.filter((s): s is string => typeof s === "string");
  } else if (typeof value === "string") {
    raw = value.split(",");
  }
  if (!raw) return undefined;

  const list = raw
    .map((s) => s.trim().slice(0, MAX_FOCUS_AREA_CHARS))
    .filter(Boolean)
    .slice(0, MAX_FOCUS_AREAS);

  return list.length ? list : undefined;
}

function buildDueAt(offsetDays: number, endOfDay: boolean): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  if (endOfDay) d.setHours(23, 59, 0, 0);
  else d.setHours(17, 0, 0, 0);
  return d.toISOString();
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      return NextResponse.json(
        { data: null, error: { code: "unauthorized", message: "Sign in required." } },
        { status: 401 }
      );
    }

    // Every request here costs real tokens, so cap the loop before it starts.
    const limit = await consume("planner_generate", user.id, 10);
    if (!limit.ok) return tooManyRequests(limit.retryAfterMs);

    let body: GenerateBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { data: null, error: { code: "bad_request", message: "Invalid JSON body." } },
        { status: 400 }
      );
    }

    const goal = body.goal?.trim();
    if (!goal) {
      return NextResponse.json(
        { data: null, error: { code: "bad_request", message: "A goal is required." } },
        { status: 400 }
      );
    }

    const days = clamp(body.days, 1, 30, 7);
    const minutesPerDay = clamp(body.minutesPerDay, 15, 480, 60);
    const subject = body.subject?.trim().slice(0, 120) || undefined;
    const examDate = body.examDate?.trim().slice(0, 32) || undefined;
    const focusAreas = parseFocusAreas(body.focusAreas);

    const generated = await generateStudyPlan({
      goal: goal.slice(0, 600),
      subject,
      days,
      minutesPerDay,
      examDate,
      focusAreas,
    });

    const endOfDay = !examDate;
    const tasks = generated.map((t) => ({
      ...t,
      due_at: buildDueAt(t.offset_days, endOfDay),
    }));

    return NextResponse.json({ data: tasks, error: null });
  } catch (error) {
    console.error("[planner] /api/planner/generate CRASH:", error);

    const message =
      "Failed to generate a study plan.";

    return NextResponse.json(
      { data: null, error: { code: "server_error", message } },
      { status: 500 }
    );
  }
}
