import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NoteEditor from "@/components/notes/NoteEditor";
import type { NoteRow } from "@/lib/study/types";

export const metadata = { title: "Edit note — EduForge AI" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NoteDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("notes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!data) notFound();

  return <NoteEditor note={data as NoteRow} />;
}
