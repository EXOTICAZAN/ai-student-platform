"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Trophy, UserCircle, Bookmark, ClipboardList, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ScholarshipSearchBar from "@/components/scholarships/ScholarshipSearchBar";
import ScholarshipFilters from "@/components/scholarships/ScholarshipFilters";
import ScholarshipGrid from "@/components/scholarships/ScholarshipGrid";
import { fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { ScholarshipSummary, ScholarshipFilters as Filters } from "@/lib/scholarships/types";

const DEFAULT_FILTERS: Filters = {
  q: "",
  country: undefined,
  degree: undefined,
  field: undefined,
  funding: undefined,
  status: undefined,
  deadline_from: undefined,
  deadline_to: undefined,
  page: 1,
  page_size: 12,
};

const NAV_LINKS = [
  { href: "/dashboard/scholarships/profile",      icon: UserCircle,    label: "My Profile"    },
  { href: "/dashboard/scholarships/saved",        icon: Bookmark,      label: "Saved"         },
  { href: "/dashboard/scholarships/applications", icon: ClipboardList, label: "Applications"  },
];

export default function ScholarshipsPage() {
  const [filters, setFilters]           = useState<Filters>(DEFAULT_FILTERS);
  const [scholarships, setScholarships] = useState<ScholarshipSummary[]>([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [countries, setCountries]       = useState<{ country_code: string; country_name: string }[]>([]);
  const [filtersOpen, setFiltersOpen]   = useState(false);
  const [hasProfile, setHasProfile]     = useState<boolean | null>(null);

  // Check if user has a scholarship profile (to show match scores)
  useEffect(() => {
    fetch("/api/scholarships/profile")
      .then((r) => r.json())
      .then((body) => setHasProfile(!!body?.data))
      .catch(() => setHasProfile(false));
  }, []);

  // Fetch scholarships when filters change
  const fetchScholarships = useCallback(async (f: Filters, profileReady: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.q)             params.set("q",             f.q);
      if (f.country)       params.set("country",       f.country);
      if (f.degree)        params.set("degree",        f.degree);
      if (f.funding)       params.set("funding",       f.funding);
      if (f.status)        params.set("status",        f.status);
      if (f.deadline_from) params.set("deadline_from", f.deadline_from);
      if (f.deadline_to)   params.set("deadline_to",   f.deadline_to);
      params.set("page",      String(f.page ?? 1));
      params.set("page_size", String(f.page_size ?? 12));

      // If user has profile, fetch matches (includes match scores)
      // Otherwise fetch regular catalog
      const endpoint = profileReady
        ? "/api/scholarships/matches"
        : `/api/scholarships?${params.toString()}`;

      const res  = await fetch(endpoint);
      const body = await res.json();

      if (!res.ok) throw new Error(body?.error?.message ?? "Failed to fetch");

      setScholarships(body.data ?? []);
      setTotal(body.meta?.total ?? body.data?.length ?? 0);
    } catch (err) {
      console.error("[Scholarships]", err);
      setScholarships([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasProfile === null) return; // wait for profile check
    // fetchScholarships sets state only after an async fetch resolves — not synchronously
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchScholarships(filters, hasProfile);
  }, [filters, hasProfile, fetchScholarships]);

  // Fetch countries for filter dropdown (one-time)
  useEffect(() => {
    fetch("/api/scholarships?page_size=100")
      .then((r) => r.json())
      .then((body) => {
        const seen = new Set<string>();
        const cs: { country_code: string; country_name: string }[] = [];
        (body.data ?? []).forEach((s: ScholarshipSummary) => {
          if (!seen.has(s.country_code)) {
            seen.add(s.country_code);
            cs.push({ country_code: s.country_code, country_name: s.country_name });
          }
        });
        setCountries(cs.sort((a, b) => a.country_name.localeCompare(b.country_name)));
      })
      .catch(() => {});
  }, []);

  function updateFilters(partial: Partial<Filters>) {
    setFilters((prev) => ({ ...prev, ...partial, page: 1 }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  function handleSaveToggle(id: string, saved: boolean) {
    setScholarships((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_saved: saved } : s))
    );
  }

  const hasActiveFilters = !!(
    filters.q || filters.country || filters.degree ||
    filters.funding || filters.status
  );

  return (
    <DashboardShell>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page header */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <motion.div variants={fadeUp} className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-indigo-400" />
                <h1 className="text-2xl font-bold text-white">Scholarships</h1>
              </div>
              <p className="text-sm text-slate-400">
                {hasProfile
                  ? "Scholarships ranked by match with your profile."
                  : "Browse fully funded scholarships. Complete your profile for personalised match scores."}
              </p>
            </div>

            {/* Sub-nav */}
            <div className="flex items-center gap-2">
              {NAV_LINKS.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2",
                    "text-xs font-medium text-slate-400 transition-all",
                    "hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-white"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Profile nudge banner */}
          {hasProfile === false && (
            <motion.div variants={fadeUp}>
              <Link
                href="/dashboard/scholarships/profile"
                className={cn(
                  "flex items-center justify-between rounded-2xl border border-indigo-500/25",
                  "bg-indigo-500/8 px-5 py-3.5 transition-colors hover:border-indigo-500/40"
                )}
              >
                <div className="flex items-center gap-3">
                  <UserCircle className="h-5 w-5 text-indigo-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      Complete your scholarship profile
                    </p>
                    <p className="text-xs text-slate-400">
                      Get personalised match scores for every scholarship.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-indigo-400">Set up →</span>
              </Link>
            </motion.div>
          )}

          {/* Search + mobile filter toggle */}
          <motion.div variants={fadeUp} className="flex gap-3">
            <ScholarshipSearchBar
              value={filters.q ?? ""}
              onChange={(q) => updateFilters({ q })}
              className="flex-1"
            />
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all lg:hidden",
                filtersOpen || hasActiveFilters
                  ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-300"
                  : "border-white/10 bg-white/5 text-slate-400"
              )}
            >
              {filtersOpen ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
              Filters
              {hasActiveFilters && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
                  !
                </span>
              )}
            </button>
          </motion.div>
        </motion.div>

        {/* Main layout */}
        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="glass-strong sticky top-20 rounded-2xl p-4">
              <ScholarshipFilters
                filters={filters}
                countries={countries}
                onChange={updateFilters}
                onReset={resetFilters}
              />
            </div>
          </aside>

          {/* Mobile filter drawer */}
          {filtersOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div
                className="absolute inset-0 bg-black/60"
                onClick={() => setFiltersOpen(false)}
              />
              <div className="absolute bottom-0 left-0 right-0 glass-strong rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto">
                <ScholarshipFilters
                  filters={filters}
                  countries={countries}
                  onChange={(f) => { updateFilters(f); }}
                  onReset={() => { resetFilters(); setFiltersOpen(false); }}
                />
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="flex-1 min-w-0">
            <ScholarshipGrid
              scholarships={scholarships}
              loading={loading}
              total={total}
              page={filters.page ?? 1}
              pageSize={filters.page_size ?? 12}
              hasFilters={hasActiveFilters}
              onPage={(p) => setFilters((prev) => ({ ...prev, page: p }))}
              onSaveToggle={handleSaveToggle}
            />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
