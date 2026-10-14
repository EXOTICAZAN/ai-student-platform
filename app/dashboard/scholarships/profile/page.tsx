import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStudentProfile } from "@/lib/scholarships/query";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ScholarshipProfileForm from "@/components/scholarships/ProfileForm/ScholarshipProfileForm";
import { ArrowLeft, UserCircle, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "Scholarship Profile — EduForge AI",
  description: "Your grades, test scores and background, used to match scholarships.",
};

export default async function ScholarshipProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profileResult = await getStudentProfile(user.id);
  const profile = profileResult.data ?? null;

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Back */}
        <Link
          href="/dashboard/scholarships"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Scholarships
        </Link>

        {/* Header */}
        <div className="glass-strong rounded-2xl p-6 space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/25">
              <UserCircle className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Scholarship Profile</h1>
              <p className="text-sm text-slate-400">
                Your profile is used to calculate match scores for every scholarship.
              </p>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/8 px-5 py-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
          <p className="text-sm text-slate-300">
            Your profile data stays private and is only used to generate match scores on
            your device. It is never shared with scholarship providers or third parties.
          </p>
        </div>

        {/* Form */}
        <ScholarshipProfileForm initial={profile} />
      </div>
    </DashboardShell>
  );
}
