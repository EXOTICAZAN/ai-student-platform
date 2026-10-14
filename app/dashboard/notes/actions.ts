"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity, XP } from "@/lib/study/activity";
import type { ActionResult, NoteRow } from "@/lib/study/types";
import { actionAllowed, ACTION_LIMIT_ERROR } from "@/lib/api/actionLimit";

// =============================================================
// AI Notes — mutations.
// Returns an ActionResult envelope so the UI can toast real
// errors instead of failing silently.
// =============================================================

export interface NoteInput {
  title: string;
  content?: string;
  summary?: string | null;
  subject?: string | null;
  tags?: string[];
  source_type?: "manual" | "ai" | "pdf";
  document_id?: string | null;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function createNote(
  input: NoteInput
): Promise<ActionResult<NoteRow>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("notes", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  const title = input.title?.trim();
  if (!title) return { ok: false, error: "A title is required." };

  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      title,
      content: input.content ?? "",
      summary: input.summary ?? null,
      subject: input.subject?.trim() || null,
      tags: input.tags ?? [],
      source_type: input.source_type ?? "manual",
      document_id: input.document_id ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[notes] create failed:", error?.message);
    return { ok: false, error: "Could not create the note." };
  }

  revalidatePath("/dashboard/notes");

  const generated = input.source_type === "ai";
  await logActivity({
    type: "note",
    label: generated ? `Generated note · ${title}` : `Created note · ${title}`,
    xp: generated ? XP.note_ai_generated : XP.note_created,
    metadata: { note_id: data.id, subject: data.subject },
  });

  return { ok: true, data };
}

export async function updateNote(
  noteId: string,
  patch: Partial<
    Pick<NoteRow, "title" | "content" | "summary" | "subject" | "tags">
  >
): Promise<ActionResult<NoteRow>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("notes", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  const payload: Record<string, unknown> = {};
  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (!title) return { ok: false, error: "A title is required." };
    payload.title = title;
  }
  if (patch.content !== undefined) payload.content = patch.content;
  if (patch.summary !== undefined) payload.summary = patch.summary;
  if (patch.subject !== undefined) payload.subject = patch.subject?.trim() || null;
  if (patch.tags !== undefined) payload.tags = patch.tags;

  const { data, error } = await supabase
    .from("notes")
    .update(payload)
    .eq("id", noteId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !data) {
    console.error("[notes] update failed:", error?.message);
    return { ok: false, error: "Could not save the note." };
  }

  revalidatePath("/dashboard/notes");
  revalidatePath(`/dashboard/notes/${noteId}`);

  return { ok: true, data };
}

export async function deleteNote(noteId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("notes", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[notes] delete failed:", error.message);
    return { ok: false, error: "Could not delete the note." };
  }

  revalidatePath("/dashboard/notes");
  return { ok: true };
}

export async function toggleNoteFavorite(
  noteId: string,
  isFavorite: boolean
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("notes", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  const { error } = await supabase
    .from("notes")
    .update({ is_favorite: isFavorite })
    .eq("id", noteId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[notes] favorite failed:", error.message);
    return { ok: false, error: "Could not update that note." };
  }

  revalidatePath("/dashboard/notes");
  return { ok: true };
}
