"use client";

import { cn } from "@/lib/utils";
import { Clock, CalendarX } from "lucide-react";

interface DeadlineBadgeProps {
  deadline: string | null;
  status: string;
  className?: string;
}

function getDaysUntil(deadline: string): number {
  const now = new Date();
  const d = new Date(deadline);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDeadline(deadline: string): string {
  return new Date(deadline).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DeadlineBadge({ deadline, status, className }: DeadlineBadgeProps) {
  if (status === "closed") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
          "bg-red-500/10 text-red-400 border border-red-500/20",
          className
        )}
      >
        <CalendarX className="h-3 w-3" />
        Closed
      </span>
    );
  }

  if (!deadline) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
          "bg-white/5 text-slate-400 border border-white/10",
          className
        )}
      >
        <Clock className="h-3 w-3" />
        {status === "upcoming" ? "Opening Soon" : "No Deadline Listed"}
      </span>
    );
  }

  const days = getDaysUntil(deadline);

  let colorCls: string;
  let label: string;

  if (days < 0) {
    colorCls = "bg-red-500/10 text-red-400 border-red-500/20";
    label = "Deadline Passed";
  } else if (days <= 7) {
    colorCls = "bg-red-500/15 text-red-400 border-red-500/25";
    label = `${days}d left`;
  } else if (days <= 30) {
    colorCls = "bg-amber-500/15 text-amber-400 border-amber-500/25";
    label = `${days}d left`;
  } else {
    colorCls = "bg-slate-500/15 text-slate-300 border-slate-500/20";
    label = formatDeadline(deadline);
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border",
        colorCls,
        className
      )}
    >
      <Clock className="h-3 w-3" />
      {label}
    </span>
  );
}
