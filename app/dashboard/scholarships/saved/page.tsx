import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getSavedScholarships,
  getStudentProfile,
} from "@/lib/scholarships/query";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ScholarshipCard from "@/components/scholarships/ScholarshipCard";
import { ArrowLeft, Bookmark, Trophy } from "lucide-react";
import type { ScholarshipSummary } from "@/lib/scholarships/types";

export const metadata: Metadata = {
  title: "Saved Scholarships — EduForge AI",
  description: "Scholarships you bookmarked for later.",
};

export default async function SavedScholarshipsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [savedResult, profileResult] = await Promise.all([
    getSavedScholarships(user.id),
    getStudentProfile(user.id),
  ]);

  const saved = savedResult.data ?? [];
  const profile = profileResult.data;

  // We only have summary data from getSavedScholarships (no requirements).
  // For saved page we show saved status & basic info — match scores
  // are only available in detail view (where full requirements are loaded).
  // Mark all as saved since they came from saved_scholarships.
  const scholarships: ScholarshipSummary[] = saved.map((s) => ({
    ...s,
    is_saved: true,
    match: null,
  }));

  return (
    <DashboardShell>
      <div className="mx-auto max-w-7xl space-y-6">
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
            <Bookmark className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Saved Scholarships</h1>
            <p className="text-sm text-slate-400">
              {scholarships.length > 0
                ? `${scholarships.length} scholarship${scholarships.length !== 1 ? "s" : ""} saved`
                : "No scholarships saved yet"}
            </p>
          </div>
        </div>

        {/* Empty state */}
        {scholarships.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <Trophy className="h-7 w-7 text-indigo-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">
              No saved scholarships yet
            </h3>
            <p className="mb-6 max-w-xs text-sm text-slate-400">
              Browse scholarships and tap the bookmark icon to save ones
              you&apos;re interested in.
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

        {/* Grid */}
        {scholarships.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {scholarships.map((s, i) => (
              <ScholarshipCard
                key={s.id}
                scholarship={s}
                index={i}
              />
            ))}
          </div>
        )}

        {!profile && scholarships.length > 0 && (
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/8 p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">
                See your match score for these scholarships
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete your scholarship profile to get personalised compatibility scores.
              </p>
            </div>
            <Link
              href="/dashboard/scholarships/profile"
              className="shrink-0 rounded-xl px-4 py-2 text-xs font-semibold btn-gradient hover:opacity-90 transition-all"
            >
              Set up profile
            </Link>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
