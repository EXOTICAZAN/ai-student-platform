"use client";

import { useState } from "react";
import { ClipboardList, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { StudentApplicationStatus } from "@/lib/scholarships/types";
import { APPLICATION_STATUS_LABELS } from "@/lib/scholarships/types";

const STATUS_STYLES: Record<StudentApplicationStatus, string> = {
  saved:      "border-slate-500/40 bg-slate-500/15 text-slate-300",
  planning:   "border-blue-500/40 bg-blue-500/15 text-blue-300",
  applying:   "border-indigo-500/40 bg-indigo-500/15 text-indigo-300",
  submitted:  "border-purple-500/40 bg-purple-500/15 text-purple-300",
  accepted:   "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  rejected:   "border-red-500/40 bg-red-500/15 text-red-400",
  withdrawn:  "border-amber-500/40 bg-amber-500/15 text-amber-400",
};

const ALL_STATUSES = Object.keys(APPLICATION_STATUS_LABELS) as StudentApplicationStatus[];

interface ApplicationStatusTrackerProps {
  scholarshipId: string;
  initialStatus: StudentApplicationStatus | null;
}

export default function ApplicationStatusTracker({
  scholarshipId,
  initialStatus,
}: ApplicationStatusTrackerProps) {
  const [status, setStatus] = useState<StudentApplicationStatus | null>(initialStatus);
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: StudentApplicationStatus) {
    if (newStatus === status || loading) return;
    setLoading(true);
    const prev = status;
    setStatus(newStatus); // optimistic

    try {
      const res = await fetch(`/api/scholarships/${scholarshipId}/application`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          submitted_at: newStatus === "submitted" ? new Date().toISOString() : null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? "Failed to update");
      }

      toast.success(`Application status: ${APPLICATION_STATUS_LABELS[newStatus]}`);
    } catch (err) {
      setStatus(prev); // revert
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-strong rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-indigo-400" />
        <h3 className="text-sm font-semibold text-white">Track Application</h3>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
        {status && !loading && (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        )}
      </div>

      {status && (
        <p className="text-xs text-slate-400">
          Current:{" "}
          <span className={cn("font-medium", STATUS_STYLES[status].split(" ")[2])}>
            {APPLICATION_STATUS_LABELS[status]}
          </span>
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => updateStatus(s)}
            disabled={loading}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-150",
              s === status
                ? STATUS_STYLES[s]
                : "border-white/8 bg-white/5 text-slate-400 hover:border-white/15 hover:text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {APPLICATION_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {!status && (
        <p className="text-xs text-slate-500">
          Track your progress — from planning to accepted.
        </p>
      )}
    </div>
  );
}
