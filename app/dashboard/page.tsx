import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  getDashboardStats,
  getRecentActivity,
  getWeeklyMinutes,
} from "@/lib/study/activity";
import DashboardShell from "@/components/dashboard/DashboardShell";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import StatCards from "@/components/dashboard/StatCards";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import ProgressCharts from "@/components/dashboard/ProgressCharts";
import UpcomingTasks from "@/components/dashboard/UpcomingTasks";
import type { StudyTaskRow } from "@/lib/study/types";

export const metadata: Metadata = {
  title: "Dashboard — EduForge AI",
  description: "Your streak, XP, recent activity and upcoming study tasks.",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    { data: profile },
    stats,
    weekly,
    activity,
    { data: taskRows },
    { data: attemptRows },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    getDashboardStats(user.id),
    getWeeklyMinutes(user.id),
    getRecentActivity(user.id, 6),
    supabase
      .from("study_tasks")
      .select("*")
      .eq("user_id", user.id)
      .neq("status", "done")
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(6),
    supabase
      .from("quiz_attempts")
      .select("score, total, completed_at, quizzes(subject)")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(200),
  ]);

  const name =
    profile?.full_name || user.email?.split("@")[0] || "Learner";

  const upcomingTasks = (taskRows ?? []) as StudyTaskRow[];

  // Subject mastery = average quiz accuracy per subject.
  const subjectScores = new Map<
    string,
    { total: number; attempts: number; accuracy: number }
  >();

  for (const attempt of (attemptRows ?? []) as {
    score: number | null;
    total: number | null;
    quizzes: { subject: string | null } | { subject: string | null }[] | null;
  }[]) {
    const joined = Array.isArray(attempt.quizzes)
      ? attempt.quizzes[0]
      : attempt.quizzes;

    const subject = joined?.subject?.trim();
    if (!subject || !attempt.total) continue;

    const existing = subjectScores.get(subject) ?? {
      total: 0,
      attempts: 0,
      accuracy: 0,
    };

    existing.total += (attempt.score ?? 0) / attempt.total;
    existing.attempts += 1;
    subjectScores.set(subject, existing);
  }

  const progress = Array.from(subjectScores.entries())
    .map(([subject, value]) => ({
      name: subject,
      progress: Math.round((value.total / value.attempts) * 100),
      detail: `${value.attempts} attempt${value.attempts === 1 ? "" : "s"}`,
    }))
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 5);

  return (
    <DashboardShell
      userName={name}
      userEmail={profile?.email ?? user.email ?? ""}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <WelcomeBanner
          name={name.split(" ")[0]}
          email={profile?.email ?? user.email ?? undefined}
          country={profile?.country}
          grade={profile?.grade}
          learningGoal={profile?.learning_goal}
        />
        <StatCards stats={stats} />
        <QuickActions />
        <ProgressCharts weekly={weekly} progress={progress} />
        <div className="grid gap-4 lg:grid-cols-2">
          <RecentActivity activity={activity} />
          <UpcomingTasks tasks={upcomingTasks} />
        </div>
      </div>
    </DashboardShell>
  );
}
