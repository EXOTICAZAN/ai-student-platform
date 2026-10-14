"use client";

import { cn } from "@/lib/utils";
import type { ScholarshipFilters, FundingType, ScholarshipStatus } from "@/lib/scholarships/types";
import { FUNDING_TYPE_LABELS, STATUS_LABELS } from "@/lib/scholarships/types";
import { RotateCcw } from "lucide-react";

const DEGREE_OPTIONS = [
  { value: "bachelor", label: "Bachelor's" },
  { value: "master",   label: "Master's" },
  { value: "phd",      label: "PhD" },
];

const FUNDING_OPTIONS = (
  Object.entries(FUNDING_TYPE_LABELS) as [FundingType, string][]
).map(([value, label]) => ({ value, label }));

const STATUS_OPTIONS = (
  Object.entries(STATUS_LABELS) as [ScholarshipStatus, string][]
).map(([value, label]) => ({ value, label }));

interface ScholarshipFiltersProps {
  filters: ScholarshipFilters;
  countries: { country_code: string; country_name: string }[];
  onChange: (filters: Partial<ScholarshipFilters>) => void;
  onReset: () => void;
  className?: string;
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-400">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white",
          "focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
          "appearance-none transition-all duration-200",
          "[&>option]:bg-[#0f1729] [&>option]:text-white"
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function ScholarshipFilters({
  filters,
  countries,
  onChange,
  onReset,
  className,
}: ScholarshipFiltersProps) {
  const hasActiveFilters =
    filters.country || filters.degree || filters.funding || filters.status;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* Status */}
      <SelectFilter
        label="Status"
        value={filters.status}
        onChange={(v) => onChange({ status: v as ScholarshipStatus | "" })}
        options={STATUS_OPTIONS}
        placeholder="All statuses"
      />

      {/* Funding Type */}
      <SelectFilter
        label="Funding Type"
        value={filters.funding}
        onChange={(v) => onChange({ funding: v as FundingType | "" })}
        options={FUNDING_OPTIONS}
        placeholder="All types"
      />

      {/* Degree Level */}
      <SelectFilter
        label="Degree Level"
        value={filters.degree}
        onChange={(v) => onChange({ degree: v })}
        options={DEGREE_OPTIONS}
        placeholder="All levels"
      />

      {/* Country */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">Country</label>
        <select
          value={filters.country ?? ""}
          onChange={(e) => onChange({ country: e.target.value || undefined })}
          className={cn(
            "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white",
            "focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
            "appearance-none transition-all duration-200",
            "[&>option]:bg-[#0f1729] [&>option]:text-white"
          )}
        >
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c.country_code} value={c.country_code}>
              {c.country_name}
            </option>
          ))}
        </select>
      </div>

      {/* Deadline Range */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">Deadline From</label>
        <input
          type="date"
          value={filters.deadline_from ?? ""}
          onChange={(e) => onChange({ deadline_from: e.target.value || undefined })}
          className={cn(
            "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white",
            "focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
            "transition-all duration-200",
            "[color-scheme:dark]"
          )}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">Deadline To</label>
        <input
          type="date"
          value={filters.deadline_to ?? ""}
          onChange={(e) => onChange({ deadline_to: e.target.value || undefined })}
          className={cn(
            "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white",
            "focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
            "transition-all duration-200",
            "[color-scheme:dark]"
          )}
        />
      </div>
    </div>
  );
}
