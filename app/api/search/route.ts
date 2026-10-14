import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { limitOrNull } from "@/lib/api/rateLimit";

// =============================================================
// GET /api/search?q=term
// Cross-feature search over the signed-in user's own notes,
// decks, quizzes and tasks. RLS scopes every query, and each
// one also filters on user_id explicitly.
// =============================================================

export interface SearchHit {
  id: string;
  kind: "Note" | "Deck" | "Quiz" | "Task";
  title: string;
  subtitle: string;
  href: string;
}

// PostgREST `or=` splits on commas and reads parentheses as grouping, so
// those are dropped from the term as well as escaped for LIKE.
function likePattern(term: string): string {
  const safe = term.replace(/[,()]/g, " ").replace(/[\\%_]/g, (c) => `\\${c}`);
  return `%${safe.trim()}%`;
}

function clip(text: string | null | undefined, max = 90): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";

    if (q.length < 2) {
      return NextResponse.json({ data: { query: q, results: [] as SearchHit[] } });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { data: null, error: { code: "unauthorized", message: "Sign in required." } },
        { status: 401 }
      );
    }

    const limited = await limitOrNull("search", user.id, 120);
    if (limited) return limited;

    const pattern = likePattern(q.slice(0, 80));
    if (pattern === "%%") {
      return NextResponse.json({ data: { query: q, results: [] as SearchHit[] } });
    }

    const PER_KIND = 4;

    const [notes, decks, quizzes, tasks] = await Promise.all([
      supabase
        .from("notes")
        .select("id, title, summary, content, subject, updated_at")
        .eq("user_id", user.id)
        .or(`title.ilike.${pattern},content.ilike.${pattern}`)
        .order("updated_at", { ascending: false })
        .limit(PER_KIND),
      supabase
        .from("flashcard_decks")
        .select("id, title, description, subject, updated_at")
        .eq("user_id", user.id)
        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
        .order("updated_at", { ascending: false })
        .limit(PER_KIND),
      supabase
        .from("quizzes")
        .select("id, title, subject, question_count, updated_at")
        .eq("user_id", user.id)
        .or(`title.ilike.${pattern},topic.ilike.${pattern}`)
        .order("updated_at", { ascending: false })
        .limit(PER_KIND),
      supabase
        .from("study_tasks")
        .select("id, title, description, subject, status, updated_at")
        .eq("user_id", user.id)
        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
        .order("updated_at", { ascending: false })
        .limit(PER_KIND),
    ]);

    const results: SearchHit[] = [
      ...(notes.data ?? []).map((n) => ({
        id: n.id as string,
        kind: "Note" as const,
        title: (n.title as string) || "Untitled note",
        subtitle: clip(n.summary ?? n.content),
        href: `/dashboard/notes/${n.id}`,
      })),
      ...(decks.data ?? []).map((d) => ({
        id: d.id as string,
        kind: "Deck" as const,
        title: (d.title as string) || "Untitled deck",
        subtitle: clip(d.description ?? d.subject),
        href: `/dashboard/flashcards/${d.id}`,
      })),
      ...(quizzes.data ?? []).map((qz) => ({
        id: qz.id as string,
        kind: "Quiz" as const,
        title: (qz.title as string) || "Untitled quiz",
        subtitle: clip(
          [qz.subject, qz.question_count ? `${qz.question_count} questions` : null]
            .filter(Boolean)
            .join(" · ")
        ),
        href: `/dashboard/quiz/${qz.id}`,
      })),
      ...(tasks.data ?? []).map((t) => ({
        id: t.id as string,
        kind: "Task" as const,
        title: (t.title as string) || "Untitled task",
        subtitle: clip(t.description ?? t.subject),
        href: `/dashboard/planner`,
      })),
    ];

    return NextResponse.json({ data: { query: q, results } });
  } catch (error) {
    console.error("[search] failed:", error);
    return NextResponse.json(
      { data: null, error: { code: "server_error", message: "Search failed." } },
      { status: 500 }
    );
  }
}
