"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calculator,
  CheckCircle2,
  ExternalLink,
  Filter,
  Link2,
  MessageCircle,
  Plus,
  RefreshCw,
  ShieldAlert,
  Users,
} from "lucide-react";
import { EXAM_CATALOGUE } from "@/lib/exam-groups";
import {
  ADMISSIONS_REFERENCE,
  DEGREES,
  OFFICIAL_LINKS,
  PROVINCES,
  calculateBudget,
  calculateMerit,
  filterAdmissions,
  type AdmissionFilters,
} from "@/lib/pakistan-hub";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-400";
function RomanUrduToggle() {
  const [roman, setRoman] = useState(false);
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <button
        type="button"
        onClick={() => setRoman(!roman)}
        className="rounded-lg border border-white/10 px-2 py-1 hover:text-white"
      >
        {roman ? "English" : "Roman Urdu"}
      </button>
      {roman && (
        <span>
          Yeh maloomat rehnumai ke liye hai — apply karne se pehle official
          source verify karein.
        </span>
      )}
    </div>
  );
}
function Notice() {
  return (
    <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100">
      <ShieldAlert className="mr-2 inline h-4 w-4" />
      Reference MVP: deadlines, eligibility and merit rules change. Verify on
      the linked official source before paying or submitting.
      <div className="mt-3">
        <RomanUrduToggle />
      </div>
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-xs text-slate-400">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </label>
  );
}

export function AdmissionsHub() {
  const defaultFilters: AdmissionFilters = {
    province: "All provinces",
    city: "",
    degree: "All degrees",
    field: "",
    sector: "All sectors",
  };
  const [filters, setFilters] = useState<AdmissionFilters>(defaultFilters);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [academic, setAcademic] = useState("80");
  const [test, setTest] = useState("70");

  useEffect(() => {
    fetch("/api/admissions/applications")
      .then((r) => (r.ok ? r.json() : null))
      .then((body) =>
        setSaved(
          (body?.data ?? []).map(
            (x: { reference_key: string }) => x.reference_key,
          ),
        ),
      )
      .catch(() => undefined);
  }, []);

  const results = useMemo(() => {
    const filtered = filterAdmissions(ADMISSIONS_REFERENCE, filters);
    const query = search.trim().toLowerCase();
    return query
      ? filtered.filter((item) =>
          `${item.institution} ${item.city} ${item.province} ${item.degree} ${item.field} ${item.tests.join(" ")}`
            .toLowerCase()
            .includes(query),
        )
      : filtered;
  }, [filters, search]);
  const set = (key: keyof AdmissionFilters, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));
  const clearFilters = () => {
    setFilters(defaultFilters);
    setSearch("");
  };
  const hasFilters =
    search.trim() ||
    Object.entries(filters).some(
      ([key, value]) => value !== defaultFilters[key as keyof AdmissionFilters],
    );

  const track = async (item: (typeof ADMISSIONS_REFERENCE)[number]) => {
    const isTracked = saved.includes(item.id);
    const next = isTracked ? "planning" : "applying";
    setSaved((current) =>
      isTracked
        ? current.filter((id) => id !== item.id)
        : [...current, item.id],
    );
    const res = await fetch("/api/admissions/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference_key: item.id,
        institution_snapshot: item.institution,
        status: next,
      }),
    });
    if (!res.ok)
      setStatusMessage(
        "Tracking is shown locally until the database migration is applied.",
      );
    else
      setStatusMessage(
        isTracked
          ? "Removed from your tracked applications."
          : "Application added to your tracked plan.",
      );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <p className="text-sm text-indigo-300">
          Pakistan Student Hub · Admissions
        </p>
        <h1 className="mt-1 text-3xl font-bold text-white">
          Pakistan Admissions Hub
        </h1>
        <p className="mt-2 max-w-3xl text-slate-400">
          Find a starting point for planning your application. This
          source-attributed reference catalogue is not an exhaustive live
          directory.
        </p>
      </header>
      <section
        className="glass-strong rounded-2xl p-5"
        aria-labelledby="admissions-search-heading"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="admissions-search-heading"
              className="flex items-center gap-2 font-semibold text-white"
            >
              <Filter className="h-4 w-4 text-indigo-300" />
              Search and filter
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Search institutions, fields, cities or test names, then narrow the
              list.
            </p>
          </div>
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:border-indigo-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear filters
          </button>
        </div>
        <label className="mb-3 block text-xs text-slate-400">
          Search admissions
          <input
            aria-label="Search admissions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. computing, Lahore, NET"
            className={`${inputClass} mt-1`}
          />
        </label>
        <div className="grid gap-3 md:grid-cols-4">
          <label className="text-xs text-slate-400">
            Province
            <select
              aria-label="Province"
              className={`${inputClass} mt-1`}
              value={filters.province}
              onChange={(e) => set("province", e.target.value)}
            >
              {PROVINCES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <Field
            label="City"
            value={filters.city}
            onChange={(v) => set("city", v)}
          />
          <label className="text-xs text-slate-400">
            Degree
            <select
              aria-label="Degree"
              className={`${inputClass} mt-1`}
              value={filters.degree}
              onChange={(e) => set("degree", e.target.value)}
            >
              {DEGREES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <Field
            label="Degree / field"
            value={filters.field}
            onChange={(v) => set("field", v)}
          />
          <label className="text-xs text-slate-400">
            Sector
            <select
              aria-label="Sector"
              className={`${inputClass} mt-1`}
              value={filters.sector}
              onChange={(e) => set("sector", e.target.value)}
            >
              <option>All sectors</option>
              <option>Public</option>
              <option>Private</option>
            </select>
          </label>
        </div>
      </section>

      <div
        className="flex flex-wrap items-center justify-between gap-2 text-sm"
        aria-live="polite"
      >
        <p className="text-slate-300">
          <strong className="text-white">{results.length}</strong> of{" "}
          {ADMISSIONS_REFERENCE.length} reference entries shown
        </p>
        <p className="text-slate-400">
          <strong className="text-indigo-200">{saved.length}</strong> tracked
        </p>
      </div>
      {statusMessage && (
        <p
          className="rounded-xl border border-indigo-300/20 bg-indigo-300/5 px-3 py-2 text-xs text-indigo-100"
          role="status"
        >
          {statusMessage}
        </p>
      )}
      {!results.length ? (
        <section className="glass-strong rounded-2xl p-8 text-center">
          <h2 className="font-semibold text-white">
            No admissions entries match those filters
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Try a broader search or reset the filters. The catalogue only
            includes reference entries with an official source link.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 rounded-lg bg-indigo-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-indigo-300"
          >
            Reset search
          </button>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {results.map((item) => (
            <article key={item.id} className="glass-strong rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-white">
                    {item.institution}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {item.city} · {item.province} · {item.sector} ·{" "}
                    {item.degree}
                  </p>
                </div>
                <span className="rounded-full bg-indigo-400/15 px-2 py-1 text-xs text-indigo-200">
                  {item.tests.join(" / ")}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/5 px-2 py-1 text-emerald-200">
                  <CheckCircle2 className="mr-1 inline h-3 w-3" />
                  Official source
                </span>
                <span className="rounded-full border border-amber-300/20 bg-amber-300/5 px-2 py-1 text-amber-100">
                  Verify current details
                </span>
              </div>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Deadline</dt>
                  <dd className="text-slate-200">{item.deadline}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Eligibility</dt>
                  <dd className="text-slate-200">{item.eligibility}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-slate-500">
                Source: {item.sourceLabel} · {item.lastVerified}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                <a
                  className="text-indigo-300 hover:text-white"
                  href={item.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open official source{" "}
                  <ExternalLink className="inline h-3 w-3" />
                </a>
                <button
                  type="button"
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-slate-300 hover:border-indigo-300 hover:text-white"
                  onClick={() => void track(item)}
                >
                  {saved.includes(item.id)
                    ? "✓ Tracking: planning"
                    : "Track application"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <section id="next-steps" className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <div className="glass-strong rounded-2xl p-5">
          <h2 className="font-semibold text-white">Practical next steps</h2>
          <ol className="mt-3 space-y-3 text-sm text-slate-300">
            <li>
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-400/15 text-indigo-200">
                1
              </span>
              Open the official source for your shortlisted entry and confirm
              deadline, eligibility, fee and required test.
            </li>
            <li>
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-400/15 text-indigo-200">
                2
              </span>
              Save the prospectus or instructions, then prepare certificates,
              identity documents and test evidence.
            </li>
            <li>
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-400/15 text-indigo-200">
                3
              </span>
              Submit only through the institution or authority’s official
              process and keep the receipt or application number.
            </li>
          </ol>
        </div>
        <div className="glass-strong rounded-2xl p-5">
          <h2 className="font-semibold text-white">Official starting points</h2>
          <p className="mt-1 text-xs text-slate-400">
            Use these authorities to verify requirements; links do not imply an
            open intake.
          </p>
          <div className="mt-3 space-y-2">
            {OFFICIAL_LINKS.slice(0, 4).map(([name, url]) => (
              <a
                className="block text-sm text-indigo-300 hover:text-white"
                href={url}
                target="_blank"
                rel="noreferrer"
                key={url}
              >
                {name} <ExternalLink className="inline h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="glass-strong rounded-2xl p-5">
          <h2 className="flex items-center gap-2 font-semibold text-white">
            <Calculator className="h-4 w-4 text-indigo-300" />
            Eligibility / merit estimator
          </h2>
          <p className="my-2 text-xs text-slate-400">
            Illustrative 50/50 estimate; each institution sets its own formula.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Academic %"
              value={academic}
              onChange={setAcademic}
              type="number"
            />
            <Field
              label="Test %"
              value={test}
              onChange={setTest}
              type="number"
            />
          </div>
          <p className="mt-4 text-2xl font-bold text-white">
            {calculateMerit(Number(academic), Number(test))}%{" "}
            <span className="text-sm font-normal text-slate-400">
              estimated merit
            </span>
          </p>
        </div>
        <div className="glass-strong rounded-2xl p-5">
          <h2 className="font-semibold text-white">
            Required-document checklist
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {[
              "CNIC/B-Form or passport copy",
              "Academic transcripts and certificates",
              "Recent photograph",
              "Domicile / residency evidence if required",
              "Test result and institution form receipt",
            ].map((x) => (
              <li key={x}>
                <CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-400" />
                {x}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

export function BudgetPlanner() {
  const [v, setV] = useState({
    tuition: "30000",
    hostel: "15000",
    transport: "5000",
    books: "3000",
    internet: "2500",
    applications: "10000",
    months: "12",
  });
  const update = (k: keyof typeof v, x: string) =>
    setV((s) => ({ ...s, [k]: x }));
  const total = calculateBudget({
    ...Object.fromEntries(Object.entries(v).map(([k, x]) => [k, Number(x)])),
  } as never);
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold text-white">
        Pakistan education budget planner
      </h1>
      <p className="text-slate-400">
        Estimate in PKR. This runs in your browser; no financial data is sent.
      </p>
      <RomanUrduToggle />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(v).map(([k, x]) => (
          <Field
            key={k}
            label={`${k} (PKR)`}
            value={x}
            onChange={(n) => update(k as keyof typeof v, n)}
            type="number"
          />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="glass-strong rounded-2xl p-5">
          <p className="text-sm text-slate-400">Estimated monthly</p>
          <p className="text-3xl font-bold text-white">
            PKR {total.monthly.toLocaleString()}
          </p>
        </div>
        <div className="glass-strong rounded-2xl p-5">
          <p className="text-sm text-slate-400">
            Estimated annual ({v.months} months + applications)
          </p>
          <p className="text-3xl font-bold text-white">
            PKR {total.annual.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

type ExamGroup = { id: string; exam_key: string; exam_name: string; title: string; description: string; province?: string | null; city?: string | null; created_by: string; max_members: number; member_count: number; created_at: string; is_member?: boolean; is_owner?: boolean };
type ExamPost = { id: string; author_id: string; body: string; resource_url?: string | null; created_at: string };

export function ExamPrep() {
  const [exam, setExam] = useState("NET");
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState<ExamGroup[]>([]);
  const [selected, setSelected] = useState<ExamGroup | null>(null);
  const [posts, setPosts] = useState<ExamPost[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [newGroup, setNewGroup] = useState({ title: "", description: "", province: "", city: "", max_members: "50" });
  const [post, setPost] = useState({ body: "", resource_url: "" });
  const selectedExam = EXAM_CATALOGUE.find((item) => item.key === exam) ?? EXAM_CATALOGUE[0];
  const loadGroups = async () => { setBusy(true); try { const response = await fetch(`/api/exam-groups?exam_key=${encodeURIComponent(exam)}&search=${encodeURIComponent(search)}`); const body = await response.json(); if (!response.ok) throw new Error(body.error ?? "Could not load groups"); setGroups(body.data ?? []); if (selected && !body.data?.some((g: ExamGroup) => g.id === selected.id)) { setSelected(null); setPosts([]); } } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load groups"); } finally { setBusy(false); } };
  // Fetch after the category changes without blocking the render phase.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const timer = window.setTimeout(() => { void loadGroups(); }, 0); return () => window.clearTimeout(timer); }, [exam]);
  const selectGroup = async (group: ExamGroup) => { setSelected(group); setMessage(""); if (!group.is_member) return; const response = await fetch(`/api/exam-groups/${group.id}/posts`); const body = await response.json(); if (response.ok) setPosts(body.data ?? []); else setMessage(body.error ?? "Could not load discussion."); };
  const membership = async (group: ExamGroup, action: "join" | "leave") => { setBusy(true); const response = await fetch(`/api/exam-groups/${group.id}/membership`, { method: action === "join" ? "POST" : "DELETE" }); const body = await response.json(); setBusy(false); if (!response.ok) { setMessage(body.error ?? "Could not update membership."); return; } await loadGroups(); setSelected({ ...group, is_member: action === "join", member_count: group.member_count + (action === "join" ? 1 : -1) }); if (action === "join") { const postsResponse = await fetch(`/api/exam-groups/${group.id}/posts`); const postsBody = await postsResponse.json(); if (postsResponse.ok) setPosts(postsBody.data ?? []); } else setPosts([]); };
  const create = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); const response = await fetch("/api/exam-groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newGroup, exam_key: exam, exam_name: selectedExam.name, max_members: Number(newGroup.max_members) }) }); const body = await response.json(); setBusy(false); if (!response.ok) { setMessage(body.error ?? "Could not create group."); return; } setShowCreate(false); setNewGroup({ title: "", description: "", province: "", city: "", max_members: "50" }); await loadGroups(); setSelected(body.data); setPosts([]); };
  const publish = async (event: React.FormEvent) => { event.preventDefault(); if (!selected || !post.body.trim()) return; setBusy(true); const response = await fetch(`/api/exam-groups/${selected.id}/posts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(post) }); const body = await response.json(); setBusy(false); if (!response.ok) { setMessage(body.error ?? "Could not publish post."); return; } setPosts((current) => [body.data, ...current]); setPost({ body: "", resource_url: "" }); };
  return <div className="mx-auto max-w-7xl space-y-6"><header><p className="text-sm text-indigo-300">Pakistan Student Hub · Exam Prep</p><h1 className="mt-1 text-3xl font-bold text-white">Study groups for entrance exams</h1><p className="mt-2 max-w-3xl text-slate-400">Find peers preparing for the same test, exchange resources, and discuss difficult questions. Keep advice respectful and verify dates, syllabi, and eligibility with official sources.</p></header><Notice />
    <section className="glass-strong rounded-2xl p-5" aria-labelledby="exam-groups-heading"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="exam-groups-heading" className="flex items-center gap-2 font-semibold text-white"><Users className="h-4 w-4 text-indigo-300" /> Browse study groups</h2><p className="mt-1 text-xs text-slate-400">Categories are intentionally broad; students decide what to study together.</p></div><button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400"><Plus className="h-4 w-4" /> Create group</button></div><div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]"><label className="text-xs text-slate-400">Exam category<select aria-label="Exam category" className={`${inputClass} mt-1`} value={exam} onChange={(e) => setExam(e.target.value)}>{EXAM_CATALOGUE.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}</select></label><label className="text-xs text-slate-400">Search groups<input aria-label="Search groups" className={`${inputClass} mt-1`} value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void loadGroups(); }} placeholder="Search title or topic" /></label><button type="button" onClick={() => void loadGroups()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 hover:border-indigo-300 hover:text-white"><RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Refresh</button></div>{message && <p role="status" className="mt-3 text-sm text-amber-200">{message}</p>}<div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"><div className="space-y-2">{groups.length === 0 && <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">No groups yet for this category. Start one and invite your classmates.</div>}{groups.map((group) => <button type="button" key={group.id} onClick={() => void selectGroup(group)} className={`w-full rounded-xl border p-4 text-left transition ${selected?.id === group.id ? "border-indigo-400 bg-indigo-500/10" : "border-white/10 bg-white/[.02] hover:border-indigo-300/60"}`}><div className="flex items-start justify-between gap-3"><span className="font-medium text-white">{group.title}</span>{group.created_by && <span className="text-xs text-indigo-300">{group.is_member ? "Joined" : "Open"}</span>}</div><p className="mt-1 line-clamp-2 text-sm text-slate-400">{group.description || "No description yet."}</p><p className="mt-3 flex items-center gap-3 text-xs text-slate-500"><span><Users className="mr-1 inline h-3 w-3" />{group.member_count}/{group.max_members}</span>{group.city || group.province ? <span>{[group.city, group.province].filter(Boolean).join(", ")}</span> : null}</p></button>)}</div><div className="min-h-[280px] rounded-xl border border-white/10 bg-white/[.02] p-4">{!selected ? <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center text-slate-400"><MessageCircle className="mb-2 h-8 w-8 text-indigo-300" /><p>Select a group to view its discussion.</p><p className="mt-1 text-xs">Join a group before posting or reading its conversation.</p></div> : <><div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3"><div><h3 className="font-semibold text-white">{selected.title}</h3><p className="mt-1 text-xs text-slate-400">{selected.exam_name} · {selected.member_count}/{selected.max_members} members {selected.is_owner ? "· Owner" : ""}</p></div><button type="button" disabled={busy} onClick={() => void membership(selected, selected.is_member ? "leave" : "join")} className="rounded-lg border border-indigo-300/40 px-3 py-1.5 text-xs text-indigo-200 hover:bg-indigo-500/10">{selected.is_member ? "Leave group" : "Join group"}</button></div>{selected.is_member ? <><div className="max-h-64 space-y-3 overflow-y-auto py-4">{posts.length === 0 ? <p className="text-sm text-slate-400">No posts yet. Share a useful resource or start a discussion.</p> : posts.map((item) => <article key={item.id} className="rounded-lg border border-white/10 p-3"><p className="whitespace-pre-wrap text-sm text-slate-200">{item.body}</p>{item.resource_url && <a className="mt-2 inline-flex max-w-full items-center gap-1 truncate text-xs text-indigo-300 hover:text-white" href={item.resource_url} target="_blank" rel="noreferrer"><Link2 className="h-3 w-3 shrink-0" />{item.resource_url}</a>}<time className="mt-2 block text-[11px] text-slate-500">{new Date(item.created_at).toLocaleString()}</time></article>)}</div><form onSubmit={publish} className="space-y-2 border-t border-white/10 pt-3"><label className="sr-only" htmlFor="post-body">Write a post</label><textarea id="post-body" required maxLength={4000} value={post.body} onChange={(e) => setPost({ ...post, body: e.target.value })} className={`${inputClass} min-h-20 resize-y`} placeholder="Ask a question, share a study tip, or explain a tricky concept" /><div className="flex gap-2"><input aria-label="Optional resource link" type="url" value={post.resource_url} onChange={(e) => setPost({ ...post, resource_url: e.target.value })} className={`${inputClass} flex-1`} placeholder="Optional resource URL (https://...)" /><button disabled={busy || !post.body.trim()} className="rounded-xl bg-indigo-500 px-4 py-2 text-sm text-white disabled:opacity-50">Post</button></div></form></> : <div className="flex min-h-[220px] items-center justify-center text-sm text-slate-400">Join this group to see and contribute to its discussion.</div>}</>}</div></div></section>
    {showCreate && <div role="dialog" aria-modal="true" aria-labelledby="create-group-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><form onSubmit={create} className="glass-strong w-full max-w-lg space-y-4 rounded-2xl p-5"><div className="flex justify-between"><h2 id="create-group-title" className="text-lg font-semibold text-white">Create a {selectedExam.name} group</h2><button type="button" aria-label="Close" onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white">×</button></div><label className="block text-xs text-slate-400">Group title<input required maxLength={100} className={`${inputClass} mt-1`} value={newGroup.title} onChange={(e) => setNewGroup({ ...newGroup, title: e.target.value })} placeholder="e.g. NET Maths accountability" /></label><label className="block text-xs text-slate-400">Description<textarea maxLength={1000} className={`${inputClass} mt-1`} value={newGroup.description} onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })} placeholder="What will this group focus on?" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-slate-400">Province<input maxLength={60} className={`${inputClass} mt-1`} value={newGroup.province} onChange={(e) => setNewGroup({ ...newGroup, province: e.target.value })} /></label><label className="text-xs text-slate-400">City<input maxLength={80} className={`${inputClass} mt-1`} value={newGroup.city} onChange={(e) => setNewGroup({ ...newGroup, city: e.target.value })} /></label></div><label className="block text-xs text-slate-400">Maximum members<input required type="number" min="2" max="500" className={`${inputClass} mt-1`} value={newGroup.max_members} onChange={(e) => setNewGroup({ ...newGroup, max_members: e.target.value })} /></label><p className="text-xs text-slate-500">Use a clear title, avoid sharing private documents, and keep discussion supportive.</p><div className="flex justify-end gap-2"><button type="button" onClick={() => setShowCreate(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300">Cancel</button><button disabled={busy} className="rounded-xl bg-indigo-500 px-4 py-2 text-sm text-white disabled:opacity-50">Create group</button></div></form></div>}
  </div>;
}

export function GuidanceAndCareers() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">
        HEC, IBCC & career guidance
      </h1>
      <Notice />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="glass-strong rounded-2xl p-5">
          <h2 className="font-semibold text-white">Verification checklists</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {[
              "Confirm institution recognition on the official regulator site",
              "Keep original certificates, transcripts and CNIC/passport scans",
              "For equivalence, check current IBCC/HEC form, fee and appointment rules",
              "Save application receipts and verify status using the official portal",
            ].map((x) => (
              <li key={x}>□ {x}</li>
            ))}
          </ul>
          <div className="mt-4 space-y-2">
            {OFFICIAL_LINKS.slice(0, 4).map(([n, u]) => (
              <a
                className="block text-sm text-indigo-300"
                href={u}
                target="_blank"
                rel="noreferrer"
                key={u}
              >
                {n} <ExternalLink className="inline h-3 w-3" />
              </a>
            ))}
          </div>
        </section>
        <section className="glass-strong rounded-2xl p-5">
          <h2 className="font-semibold text-white">
            Freelancing & career path
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Build on the existing{" "}
            <Link className="text-indigo-300" href="/dashboard/career-roadmap">
              career roadmap
            </Link>
            .
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {[
              "Portfolio: 2–3 outcome-based projects with links",
              "CV: skills, evidence, education and truthful dates",
              "Proposal: restate brief, deliverables, timeline and questions",
              "Safety: never pay to unlock work; avoid off-platform pressure and guaranteed-income claims",
              "Use staged milestones and keep records of agreements",
            ].map((x) => (
              <li key={x}>✓ {x}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
