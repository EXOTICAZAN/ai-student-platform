"use client";

import { cn } from "@/lib/utils";
import type { MatchResult, MatchCategory } from "@/lib/scholarships/types";

const CATEGORY_CONFIG: Record<
  MatchCategory,
  { label: string; color: string; ringColor: string; bg: string }
> = {
  strong_match:  { label: "Strong Match",    color: "text-emerald-400", ringColor: "#34d399", bg: "bg-emerald-500/10 border-emerald-500/25" },
  possible_match:{ label: "Possible Match",  color: "text-amber-400",   ringColor: "#fbbf24", bg: "bg-amber-500/10 border-amber-500/25"   },
  low_match:     { label: "Low Match",       color: "text-slate-400",   ringColor: "#94a3b8", bg: "bg-slate-500/10 border-slate-500/20"   },
  not_eligible:  { label: "Not Eligible",    color: "text-red-400",     ringColor: "#f87171", bg: "bg-red-500/10 border-red-500/20"       },
  no_profile:    { label: "Profile Needed",  color: "text-slate-400",   ringColor: "#64748b", bg: "bg-white/5 border-white/10"            },
};

interface MatchScoreProps {
  match: MatchResult;
  size?: "sm" | "md" | "lg";
  showBreakdown?: boolean;
  className?: string;
}

function ScoreRing({
  score,
  ringColor,
  size,
}: {
  score: number;
  ringColor: string;
  size: "sm" | "md" | "lg";
}) {
  const dims = { sm: 40, md: 56, lg: 72 };
  const strokes = { sm: 3, md: 4, lg: 5 };
  const dim = dims[size];
  const stroke = strokes[size];
  const r = (dim - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const fontSize = size === "sm" ? 9 : size === "md" ? 12 : 16;

  return (
    <svg width={dim} height={dim} className="rotate-[-90deg]" aria-hidden>
      <circle
        cx={dim / 2}
        cy={dim / 2}
        r={r}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={dim / 2}
        cy={dim / 2}
        r={r}
        stroke={ringColor}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={fontSize}
        fontWeight="700"
        style={{ transform: "rotate(90deg)", transformOrigin: "50% 50%" }}
      >
        {score}
      </text>
    </svg>
  );
}

export default function MatchScore({
  match,
  size = "md",
  showBreakdown = false,
  className,
}: MatchScoreProps) {
  const config = CATEGORY_CONFIG[match.category] ?? CATEGORY_CONFIG.no_profile;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Score ring + label */}
      <div className="flex items-center gap-3">
        {match.category !== "no_profile" && (
          <ScoreRing score={match.score} ringColor={config.ringColor} size={size} />
        )}
        <div>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
              config.bg
            )}
          >
            <span className={config.color}>{config.label}</span>
          </span>
          {match.category !== "no_profile" && match.category !== "not_eligible" && (
            <p className="mt-0.5 text-xs text-slate-400">{match.score}/100 compatibility</p>
          )}
        </div>
      </div>

      {/* Breakdown */}
      {showBreakdown && (
        <div className="space-y-2 text-xs">
          {match.failed_mandatory.length > 0 && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <p className="mb-1 font-semibold text-red-400">Disqualifying</p>
              {match.failed_mandatory.map((r) => (
                <p key={r.requirement_id} className="text-red-300/80">
                  • {r.reason}
                </p>
              ))}
            </div>
          )}
          {match.strong_matches.length > 0 && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
              <p className="mb-1 font-semibold text-emerald-400">Matching</p>
              {match.strong_matches.map((r) => (
                <p key={r.requirement_id} className="text-emerald-300/80">
                  • {r.reason}
                </p>
              ))}
            </div>
          )}
          {match.potential_issues.length > 0 && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
              <p className="mb-1 font-semibold text-amber-400">Review</p>
              {match.potential_issues.map((r) => (
                <p key={r.requirement_id} className="text-amber-300/80">
                  • {r.reason}
                </p>
              ))}
            </div>
          )}
          {match.missing_info.length > 0 && (
            <div className="rounded-lg border border-slate-500/20 bg-slate-500/10 p-3">
              <p className="mb-1 font-semibold text-slate-400">Missing Info</p>
              {match.missing_info.map((r) => (
                <p key={r.requirement_id} className="text-slate-400/80">
                  • {r.reason}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
