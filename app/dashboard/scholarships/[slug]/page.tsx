import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getScholarshipDetail,
  getSavedScholarshipIds,
  getStudentProfile,
  getApplications,
} from "@/lib/scholarships/query";
import { matchScholarship } from "@/lib/scholarships/matching";
import DashboardShell from "@/components/dashboard/DashboardShell";
import SaveButton from "@/components/scholarships/SaveButton";
import ApplicationStatusTracker from "@/components/scholarships/ApplicationTracker/ApplicationStatusTracker";
import FundingBadge from "@/components/scholarships/FundingBadge";
import DeadlineBadge from "@/components/scholarships/DeadlineBadge";
import MatchScore from "@/components/scholarships/MatchScore";
import AIAdvisor from "@/components/scholarships/AIAdvisor";
import {
  ArrowLeft, ExternalLink, Globe, GraduationCap,
  FileText, BadgeCheck, Calendar, BookOpen, CheckCircle2,
  Circle, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScholarshipDetail } from "@/lib/scholarships/types";
import { DEGREE_LEVEL_LABELS } from "@/lib/scholarships/types";

// ------------------------------------------------------------------
// Section wrapper
// ------------------------------------------------------------------

function Section({ title, icon: Icon, children }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-strong rounded-2xl p-6 space-y-4">
      <h2 className="flex items-center gap-2 text-base font-semibold text-white">
        <Icon className="h-4 w-4 text-indigo-400" />
        {title}
      </h2>
      {children}
    </div>
  );
}

// ------------------------------------------------------------------
// Funding breakdown
// ------------------------------------------------------------------

function FundingSection({ scholarship }: { scholarship: ScholarshipDetail }) {
  const items = [
    { label: "Tuition Coverage",  value: scholarship.tuition_coverage },
    { label: "Monthly Stipend",   value: scholarship.stipend },
    { label: "Accommodation",     value: scholarship.accommodation },
    { label: "Travel Support",    value: scholarship.travel_support },
    { label: "Health Insurance",  value: scholarship.insurance_support },
    { label: "Other Benefits",    value: scholarship.other_benefits },
  ].filter((i) => i.value);

  if (items.length === 0) return null;

  return (
    <Section title="Funding & Benefits" icon={GraduationCap}>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-emerald-500/15 bg-emerald-500/8 p-3">
            <dt className="text-xs font-medium text-emerald-400">{label}</dt>
            <dd className="mt-0.5 text-sm text-white">{value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

// ------------------------------------------------------------------
// Eligibility requirements
// ------------------------------------------------------------------

function EligibilitySection({ scholarship }: { scholarship: ScholarshipDetail }) {
  const reqs = scholarship.requirements ?? [];
  if (reqs.length === 0) return null;

  const required = reqs.filter((r) => r.required);
  const optional = reqs.filter((r) => !r.required);

  return (
    <Section title="Eligibility Requirements" icon={BadgeCheck}>
      {required.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400">Required</p>
          {required.map((r) => (
            <div key={r.id} className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
              <div>
                <p className="text-sm text-white">{r.description}</p>
                {r.source_reference && (
                  <a
                    href={r.source_reference}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Source ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {optional.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400">Preferred / Optional</p>
          {optional.map((r) => (
            <div key={r.id} className="flex items-start gap-2.5">
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <p className="text-sm text-slate-300">{r.description}</p>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

// ------------------------------------------------------------------
// Required documents
// ------------------------------------------------------------------

function DocumentsSection({ scholarship }: { scholarship: ScholarshipDetail }) {
  const docs = [...(scholarship.documents ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  if (docs.length === 0) return null;

  return (
    <Section title="Required Documents" icon={FileText}>
      <div className="space-y-2">
        {docs.map((d) => (
          <div key={d.id} className="flex items-start gap-2.5">
            {d.required ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            )}
            <div>
              <p className="text-sm text-white">
                {d.document_name}
                {!d.required && (
                  <span className="ml-2 text-xs text-slate-500">(optional)</span>
                )}
              </p>
              {d.notes && <p className="text-xs text-slate-400">{d.notes}</p>}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ------------------------------------------------------------------
// Dates section
// ------------------------------------------------------------------

function DatesSection({ scholarship }: { scholarship: ScholarshipDetail }) {
  if (!scholarship.application_deadline && !scholarship.application_open_date) return null;

  function fmt(d: string) {
    return new Date(d).toLocaleDateString("en-US", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  }

  return (
    <Section title="Dates & Deadlines" icon={Calendar}>
      <div className="space-y-3">
        {scholarship.application_open_date && (
          <div>
            <p className="text-xs font-medium text-slate-400">Applications Open</p>
            <p className="text-sm text-white">{fmt(scholarship.application_open_date)}</p>
          </div>
        )}
        {scholarship.application_deadline && (
          <div>
            <p className="text-xs font-medium text-slate-400">Application Deadline</p>
            <p className="text-sm text-white">{fmt(scholarship.application_deadline)}</p>
            {scholarship.deadline_timezone && scholarship.deadline_timezone !== "UTC" && (
              <p className="text-xs text-slate-500">{scholarship.deadline_timezone}</p>
            )}
            <div className="mt-1.5">
              <DeadlineBadge
                deadline={scholarship.application_deadline}
                status={scholarship.status}
              />
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

// ------------------------------------------------------------------
// Source / verification
// ------------------------------------------------------------------

function SourceSection({ scholarship }: { scholarship: ScholarshipDetail }) {
  const sources = scholarship.sources ?? [];

  return (
    <Section title="Verification & Sources" icon={BookOpen}>
      <div className="space-y-2">
        {scholarship.last_verified_at && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" />
            Last verified:{" "}
            {new Date(scholarship.last_verified_at).toLocaleDateString("en-US", {
              month: "short", year: "numeric",
            })}
          </div>
        )}

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/8 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <p className="text-xs text-amber-300/80">
              Always verify deadlines, requirements, and award amounts on official websites
              before applying. Scholarship details can change each cycle.
            </p>
          </div>
        </div>

        {sources.length > 0 && (
          <div className="space-y-1.5">
            {sources.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                {s.title ?? s.url}
              </a>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ScholarshipDetailPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { slug } = await params;

  const [detailResult, savedIds, profileResult, applicationsResult] = await Promise.all([
    getScholarshipDetail(slug),
    getSavedScholarshipIds(user.id),
    getStudentProfile(user.id),
    getApplications(user.id),
  ]);

  if (detailResult.error || !detailResult.data) notFound();

  const scholarship = detailResult.data;
  const isSaved = savedIds.includes(scholarship.id);
  const profile = profileResult.data;
  const match = profile ? matchScholarship(scholarship, profile) : null;
  const existingApp = (applicationsResult.data ?? []).find(
    (a) => a.scholarship_id === scholarship.id
  );
  const applicationStatus = existingApp?.status ?? null;

  const degrees = scholarship.degree_levels
    .map((d) => DEGREE_LEVEL_LABELS[d] ?? d)
    .join(", ");

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

        {/* Hero card */}
        <div className="glass-strong rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="mb-3 flex flex-wrap gap-2">
                <FundingBadge type={scholarship.funding_type} size="md" />
                <DeadlineBadge
                  deadline={scholarship.application_deadline}
                  status={scholarship.status}
                />
              </div>

              {/* Title */}
              <h1 className="text-xl font-bold text-white sm:text-2xl">
                {scholarship.name}
              </h1>
              <p className="mt-1 text-base text-slate-300">{scholarship.provider_name}</p>
              {scholarship.university_name && (
                <p className="text-sm text-slate-400">{scholarship.university_name}</p>
              )}
            </div>

            {/* Save button */}
            <SaveButton
              scholarshipId={scholarship.id}
              initialSaved={isSaved}
              showLabel
            />
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-slate-500" />
              {scholarship.country_name}
            </span>
            {degrees && (
              <span className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-slate-500" />
                {degrees}
              </span>
            )}
          </div>

          {/* Fields */}
          {scholarship.fields.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {scholarship.fields.map((f) => (
                <span
                  key={f}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-300"
                >
                  {f}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <p className="text-sm leading-relaxed text-slate-300">{scholarship.description}</p>

          {/* Apply CTA */}
          {scholarship.application_url && (
            <a
              href={scholarship.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold",
                "btn-gradient transition-all duration-200 hover:opacity-90"
              )}
            >
              <ExternalLink className="h-4 w-4" />
              Apply on Official Website
            </a>
          )}
          <a
            href={scholarship.official_source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
            {scholarship.official_source_url}
          </a>
        </div>

        {/* Two-column layout on desktop */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
          {/* Main content */}
          <div className="space-y-5">
            <FundingSection scholarship={scholarship} />
            <EligibilitySection scholarship={scholarship} />
            <DocumentsSection scholarship={scholarship} />
            <DatesSection scholarship={scholarship} />
            <SourceSection scholarship={scholarship} />

            {/* AI Advisor */}
            <AIAdvisor
              scholarshipId={scholarship.id}
              scholarshipName={scholarship.name}
            />
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            {match && (
              <div className="glass-strong sticky top-20 rounded-2xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-white">Your Match</h2>
                <MatchScore
                  match={match}
                  size="lg"
                  showBreakdown
                />
                {match.category === "no_profile" && (
                  <Link
                    href="/dashboard/scholarships/profile"
                    className="block w-full rounded-xl border border-indigo-500/30 bg-indigo-500/10 py-2.5 text-center text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                  >
                    Complete your profile →
                  </Link>
                )}
              </div>
            )}
            <ApplicationStatusTracker
              scholarshipId={scholarship.id}
              initialStatus={applicationStatus}
            />
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}
