import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getApplications } from "@/lib/scholarships/query";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { ApplicationCard } from "@/components/scholarships/ApplicationTracker/ApplicationCard";
import { ArrowLeft, ClipboardList, Trophy } from "lucide-react";
import type { StudentApplicationStatus } from "@/lib/scholarships/types";
import { APPLICATION_STATUS_LABELS } from "@/lib/scholarships/types";

const STATUS_ORDER: StudentApplicationStatus[] = [
  "applying", "submitted", "planning", "saved",
  "accepted", "rejected", "withdrawn",
];

export const metadata: Metadata = {
  title: "Scholarship Applications — EduForge AI",
  description: "Track every scholarship application by status.",
};

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await getApplications(user.id);
  const applications = result.data ?? [];

  // Group by status for summary
  const statusCounts = applications.reduce<Partial<Record<StudentApplicationStatus, number>>>(
    (acc, app) => {
      acc[app.status] = (acc[app.status] ?? 0) + 1;
      return acc;
    },
    {}
  );

  // Sort by status order then by update date
  const sorted = [...applications].sort((a, b) => {
    const ai = STATUS_ORDER.indexOf(a.status);
    const bi = STATUS_ORDER.indexOf(b.status);
    if (ai !== bi) return ai - bi;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Back */}
        <Link
          href="/dashboard/scholarships"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Scholarships
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/25">
            <ClipboardList className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Application Tracker</h1>
            <p className="text-sm text-slate-400">
              {applications.length > 0
                ? `Tracking ${applications.length} scholarship${applications.length !== 1 ? "s" : ""}`
                : "No applications tracked yet"}
            </p>
          </div>
        </div>

        {/* Status summary pills */}
        {applications.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {STATUS_ORDER.filter((s) => statusCounts[s]).map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300"
              >
                <span className="font-bold text-white">{statusCounts[s]}</span>
                {APPLICATION_STATUS_LABELS[s]}
              </span>
            ))}
          </div>
        )}

        {/* Empty state */}
        {applications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <Trophy className="h-7 w-7 text-indigo-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">
              No applications tracked yet
            </h3>
            <p className="mb-6 max-w-xs text-sm text-slate-400">
              Open any scholarship detail page and update the application status
              to start tracking your progress.
            </p>
            <Link
              href="/dashboard/scholarships"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold btn-gradient hover:opacity-90 transition-all"
            >
              <Trophy className="h-4 w-4" />
              Browse Scholarships
            </Link>
          </div>
        )}

        {/* Applications grid */}
        {sorted.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((app) => (
              <ApplicationCard key={app.id} application={app} />
            ))}
          </div>
        )}

        {/* Tip banner */}
        {applications.length > 0 && (
          <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-slate-400">
            <strong className="text-white">Tip:</strong> Click &quot;View Scholarship
            Details&quot; on any card to see the full scholarship page, set notes, and
            use the AI Advisor for guidance.
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
