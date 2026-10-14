"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink, ChevronDown, Loader2, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";
import { toast } from "sonner";
import type { ScholarshipApplicationRow, ScholarshipSummary, StudentApplicationStatus } from "@/lib/scholarships/types";
import { APPLICATION_STATUS_LABELS } from "@/lib/scholarships/types";
import FundingBadge from "../FundingBadge";
import DeadlineBadge from "../DeadlineBadge";

const STATUS_STYLES: Record<StudentApplicationStatus, string> = {
  saved:      "bg-slate-500/15 text-slate-300 border-slate-500/25",
  planning:   "bg-blue-500/15 text-blue-300 border-blue-500/25",
  applying:   "bg-indigo-500/15 text-indigo-300 border-indigo-500/25",
  submitted:  "bg-purple-500/15 text-purple-300 border-purple-500/25",
  accepted:   "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  rejected:   "bg-red-500/15 text-red-400 border-red-500/25",
  withdrawn:  "bg-amber-500/15 text-amber-400 border-amber-500/25",
};

const ALL_STATUSES = Object.keys(APPLICATION_STATUS_LABELS) as StudentApplicationStatus[];

interface ApplicationCardProps {
  application: ScholarshipApplicationRow & { scholarship: ScholarshipSummary };
  onUpdate?: (id: string, status: StudentApplicationStatus) => void;
}

export function ApplicationCard({ application, onUpdate }: ApplicationCardProps) {
  const { scholarship } = application;
  const [status, setStatus] = useState<StudentApplicationStatus>(application.status);
  const [loading, setLoading] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  async function updateStatus(newStatus: StudentApplicationStatus) {
    if (newStatus === status || loading) return;
    setLoading(true);
    const prev = status;
    setStatus(newStatus); // optimistic

    try {
      const res = await fetch(
        `/api/scholarships/${application.scholarship_id}/application`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            submitted_at:
              newStatus === "submitted" ? new Date().toISOString() : application.submitted_at,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to update status");
      onUpdate?.(application.id, newStatus);
      toast.success(`Status updated to ${APPLICATION_STATUS_LABELS[newStatus]}`);
    } catch {
      setStatus(prev); // revert
      toast.error("Failed to update application status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      <div className="glass-strong rounded-2xl p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Link
              href={`/dashboard/scholarships/${scholarship.slug}`}
              className="text-sm font-semibold text-white hover:text-indigo-300 transition-colors line-clamp-2"
            >
              {scholarship.name}
            </Link>
            <p className="mt-0.5 text-xs text-slate-400">{scholarship.country_name}</p>
          </div>

          {/* Status selector */}
          <div className="relative shrink-0">
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                  STATUS_STYLES[status]
                )}
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  APPLICATION_STATUS_LABELS[status]
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <FundingBadge type={scholarship.funding_type} />
          <DeadlineBadge
            deadline={scholarship.application_deadline}
            status={scholarship.status}
          />
        </div>

        {/* Status pipeline */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-400">Update Status</p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={loading}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                  s === status
                    ? STATUS_STYLES[s]
                    : "border-white/8 bg-white/5 text-slate-400 hover:border-white/15 hover:text-white"
                )}
              >
                {APPLICATION_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Notes toggle */}
        {application.notes && (
          <div>
            <button
              onClick={() => setShowNotes((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <StickyNote className="h-3.5 w-3.5" />
              Notes
              <ChevronDown className={cn("h-3 w-3 transition-transform", showNotes && "rotate-180")} />
            </button>
            {showNotes && (
              <p className="mt-2 rounded-lg border border-white/8 bg-white/5 p-3 text-xs text-slate-300 leading-relaxed">
                {application.notes}
              </p>
            )}
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/dashboard/scholarships/${scholarship.slug}`}
          className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Scholarship Details
        </Link>
      </div>
    </motion.div>
  );
}
