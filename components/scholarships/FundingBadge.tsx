"use client";

import { cn } from "@/lib/utils";
import type { FundingType } from "@/lib/scholarships/types";
import { FUNDING_TYPE_LABELS } from "@/lib/scholarships/types";

const FUNDING_STYLES: Record<FundingType, string> = {
  fully_funded:     "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  partially_funded: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  tuition_only:     "bg-blue-500/15 text-blue-400 border-blue-500/25",
  stipend_only:     "bg-purple-500/15 text-purple-400 border-purple-500/25",
  unknown:          "bg-white/5 text-slate-400 border-white/10",
};

interface FundingBadgeProps {
  type: FundingType;
  className?: string;
  size?: "sm" | "md";
}

export default function FundingBadge({ type, className, size = "sm" }: FundingBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        FUNDING_STYLES[type] ?? FUNDING_STYLES.unknown,
        className
      )}
    >
      {FUNDING_TYPE_LABELS[type] ?? type}
    </span>
  );
}
