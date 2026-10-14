import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PlannerClient from "@/components/planner/PlannerClient";
import type { StudyTaskRow } from "@/lib/study/types";

export const metadata = { title: "Study Planner — EduForge AI" };

export default async function PlannerPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("study_tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("due_at", { ascending: true })
    .order("sort_order", { ascending: true })
    .limit(500);

  return <PlannerClient tasks={(data ?? []) as StudyTaskRow[]} />;
}
