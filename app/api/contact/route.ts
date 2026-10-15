import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { consume, tooManyRequests } from "@/lib/api/rateLimit";
import { readJson, serverError } from "@/lib/api/guard";

// =============================================================
// POST /api/contact — stores a contact-form message.
// Public (no sign-in), so it is rate limited per IP and carries a
// honeypot field. Rows land in `contact_messages` (migration 005),
// which is insert-only for the public API.
// =============================================================

const TOPICS = new Set([
  "General question",
  "Product support",
  "Feedback or suggestion",
  "Partnership",
  "Press inquiry",
  "Security disclosure",
]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function bad(message: string, status = 400) {
  return NextResponse.json(
    { data: null, error: { code: "invalid_request", message } },
    { status }
  );
}

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const limit = await consume("contact", ip, 5, 10 * 60_000);
    if (!limit.ok) return tooManyRequests(limit.retryAfterMs);

    const body = await readJson<{
      name?: unknown;
      email?: unknown;
      topic?: unknown;
      message?: unknown;
      website?: unknown;
    }>(req);
    if (!body) return bad("Invalid request.");

    // Honeypot: real users never see or fill this field. Pretend success.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ data: { ok: true }, error: null });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const topic = typeof body.topic === "string" ? body.topic.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (name.length < 2 || name.length > 120) return bad("Please enter your name.");
    if (!EMAIL_RE.test(email) || email.length > 254) return bad("Please enter a valid email.");
    if (!TOPICS.has(topic)) return bad("Please choose a topic.");
    if (message.length < 20) return bad("Please write at least 20 characters.");
    if (message.length > 5000) return bad("Message is too long (5000 characters max).", 413);

    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;

    const { error } = await supabase.from("contact_messages").insert({
      name,
      email,
      topic,
      message,
      user_id: user?.id ?? null,
    });

    if (error) {
      return serverError("contact insert", error, "Could not send your message. Please try again.");
    }

    return NextResponse.json({ data: { ok: true }, error: null });
  } catch (error) {
    return serverError("contact route", error, "Could not send your message. Please try again.");
  }
}
