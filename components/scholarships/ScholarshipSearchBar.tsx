"use client";

import { useState, useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScholarshipSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function ScholarshipSearchBar({
  value,
  onChange,
  placeholder = "Search scholarships, providers, countries...",
  className,
}: ScholarshipSearchBarProps) {
  // When value prop is empty string (reset), treat it as the display value.
  // Otherwise show the locally typed value for a responsive feel.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [local, setLocal] = useState(value);

  // Derive the displayed value: if parent says empty, clear local too
  const displayed = value === "" && local !== "" ? "" : local;

  function handleChange(v: string) {
    setLocal(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), 350);
  }

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={displayed}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-10",
          "text-sm text-white placeholder:text-slate-500",
          "focus:border-indigo-500/50 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
          "transition-all duration-200"
        )}
      />
      {displayed && (
        <button
          onClick={() => handleChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
