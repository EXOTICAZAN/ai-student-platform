import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/supabase/server";
import NotesClient from "@/components/notes/NotesClient";
import type { NoteRow } from "@/lib/study/types";

export const metadata = { title: "AI Notes — EduForge AI" };

export default async function NotesPage() {
  const { supabase, user } = await getAuthContext();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(200);

  const { data: docs } = await supabase
    .from("documents")
    .select("id, file_name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <NotesClient
      notes={(data ?? []) as NoteRow[]}
      documents={
        (docs ?? []) as { id: string; file_name: string | null }[]
      }
    />
  );
}
