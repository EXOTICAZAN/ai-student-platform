"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Globe, GraduationCap, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { cardHover, fadeUp } from "@/lib/motion";
import type { ScholarshipSummary } from "@/lib/scholarships/types";
import { DEGREE_LEVEL_LABELS } from "@/lib/scholarships/types";
import FundingBadge from "./FundingBadge";
import DeadlineBadge from "./DeadlineBadge";
import MatchScore from "./MatchScore";
import SaveButton from "./SaveButton";

interface ScholarshipCardProps {
  scholarship: ScholarshipSummary;
  index?: number;
  onSaveToggle?: (id: string, saved: boolean) => void;
}

export default function ScholarshipCard({
  scholarship,
  index = 0,
  onSaveToggle,
}: ScholarshipCardProps) {
  const {
    id, slug, name, provider_name, university_name,
    country_name, degree_levels, fields,
    funding_type, status, application_deadline,
    is_saved, match,
  } = scholarship;

  const degreesDisplay = degree_levels
    .map((d) => DEGREE_LEVEL_LABELS[d] ?? d)
    .join(", ");

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ delay: index * 0.05 }}
      whileHover="hover"
    >
      <motion.div variants={cardHover} initial="rest">
        <div
          className={cn(
            "glass-strong group relative flex h-full flex-col rounded-2xl p-5",
            "transition-shadow duration-300 hover:glow hover:shadow-indigo-500/10"
          )}
        >
          {/* Top row: match score + save */}
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <FundingBadge type={funding_type} />
              <DeadlineBadge deadline={application_deadline} status={status} />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {match && <MatchScore match={match} size="sm" />}
              <SaveButton
                scholarshipId={id}
                initialSaved={is_saved ?? false}
                onToggle={(saved) => onSaveToggle?.(id, saved)}
              />
            </div>
          </div>

          {/* Title */}
          <Link href={`/dashboard/scholarships/${slug}`} className="group/link">
            <h3 className="mb-1 text-base font-semibold leading-snug text-white transition-colors group-hover/link:text-indigo-300 line-clamp-2">
              {name}
            </h3>
          </Link>

          {/* Provider */}
          <p className="mb-3 text-sm text-slate-400 line-clamp-1">{provider_name}</p>

          {/* Meta row */}
          <div className="mt-auto space-y-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              <span className="line-clamp-1">
                {university_name ? `${university_name} · ` : ""}
                {country_name}
              </span>
            </div>
            {degree_levels.length > 0 && (
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                <span className="line-clamp-1">{degreesDisplay}</span>
              </div>
            )}
            {fields.length > 0 && fields[0] !== "Any field" && (
              <div className="flex flex-wrap gap-1 pt-1">
                {fields.slice(0, 3).map((f) => (
                  <span
                    key={f}
                    className="rounded-md border border-white/8 bg-white/5 px-1.5 py-0.5 text-[11px] text-slate-400"
                  >
                    {f}
                  </span>
                ))}
                {fields.length > 3 && (
                  <span className="text-[11px] text-slate-500">
                    +{fields.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* CTA */}
          <Link
            href={`/dashboard/scholarships/${slug}`}
            className={cn(
              "mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10",
              "bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300",
              "transition-all duration-200 hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-white"
            )}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Details
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
