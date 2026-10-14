"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity, XP } from "@/lib/study/activity";
import type { ActionResult } from "@/lib/study/types";
import { actionAllowed, ACTION_LIMIT_ERROR } from "@/lib/api/actionLimit";

/* ---------- Create New Chat ---------- */
export async function startChat(
  firstMessage?: string
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("tutor", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  const seed = firstMessage?.trim() ?? "";
  const title = seed ? `${seed.slice(0, 48)}${seed.length > 48 ? "…" : ""}` : "New Chat";

  const { data: chat, error } = await supabase
    .from("chats")
    .insert({ user_id: user.id, title })
    .select("id")
    .single();

  if (error || !chat) {
    console.error("[tutor] create chat failed:", error?.message);
    return { ok: false, error: "Could not start a chat." };
  }

  revalidatePath("/dashboard/tutor");

  await logActivity({
    type: "tutor",
    label: seed ? `Started a tutor session · ${title}` : "Started a tutor session",
    xp: XP.tutor_message,
  });

  return { ok: true, data: { id: chat.id } };
}

// Mirrors the cap enforced on /api/chat so a message can never be streamed
// successfully and then rejected on persist.
const MAX_MESSAGE_CHARS = 8000;

/* ---------- Save Message ---------- */
async function requireChatOwner(chatId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: chat, error } = await supabase
    .from("chats")
    .select("id")
    .eq("id", chatId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) console.error("[tutor] chat lookup failed:", error.message);

  return chat ? { supabase, user } : null;
}

export async function sendMessage(
  chatId: string,
  content: string,
  role: "user" | "assistant" = "user"
): Promise<ActionResult> {
  const owner = await requireChatOwner(chatId);
  if (!owner) return { ok: false, error: "Chat not found." };
  if (!(await actionAllowed("tutor", owner.user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  const text = content?.trim();
  if (!text) return { ok: false, error: "Message is empty." };

  const { error } = await owner.supabase.from("messages").insert({
    chat_id: chatId,
    role,
    content: text.slice(0, MAX_MESSAGE_CHARS),
  });

  if (error) {
    console.error("[tutor] save message failed:", error.message);
    return { ok: false, error: "Could not save the message." };
  }

  revalidatePath(`/dashboard/tutor/${chatId}`);
  return { ok: true };
}

/* ---------- Delete Chat ---------- */
export async function deleteChat(
  chatId: string
): Promise<ActionResult> {
  const owner = await requireChatOwner(chatId);
  if (!owner) return { ok: false, error: "Chat not found." };
  if (!(await actionAllowed("tutor", owner.user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  // Read the linked document first: deleting the chat clears the reference,
  // and the PDF would otherwise stay in Storage with nothing pointing at it.
  const { data: chatRow } = await owner.supabase
    .from("chats")
    .select("document_id")
    .eq("id", chatId)
    .eq("user_id", owner.user.id)
    .maybeSingle();

  const { error: messagesError } = await owner.supabase
    .from("messages")
    .delete()
    .eq("chat_id", chatId);

  if (messagesError) {
    console.error("[tutor] delete messages failed:", messagesError.message);
    return { ok: false, error: "Could not delete the chat." };
  }

  const { error } = await owner.supabase
    .from("chats")
    .delete()
    .eq("id", chatId)
    .eq("user_id", owner.user.id);

  if (error) {
    console.error("[tutor] delete chat failed:", error.message);
    return { ok: false, error: "Could not delete the chat." };
  }

  if (chatRow?.document_id) {
    const { data: doc } = await owner.supabase
      .from("documents")
      .select("storage_path")
      .eq("id", chatRow.document_id)
      .eq("user_id", owner.user.id)
      .maybeSingle();

    // Chunks cascade from the document row.
    const { error: docError } = await owner.supabase
      .from("documents")
      .delete()
      .eq("id", chatRow.document_id)
      .eq("user_id", owner.user.id);
    if (docError) console.error("[tutor] delete document failed:", docError.message);

    if (doc?.storage_path) {
      const { error: fileError } = await owner.supabase.storage
        .from("documents")
        .remove([doc.storage_path]);
      if (fileError) console.error("[tutor] delete file failed:", fileError.message);
    }
  }

  revalidatePath("/dashboard/tutor");
  return { ok: true };
}
