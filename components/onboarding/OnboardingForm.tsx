"use client";
import { useState, useTransition } from "react";
import { completeOnboarding } from "@/app/onboarding/actions";
import type { OnboardingInput } from "@/lib/onboarding/validation";
const fields = [
  ["country", "Country", "e.g. Pakistan"], ["education_level", "Education level", "e.g. High school"],
  ["grade", "Grade or year", "e.g. Grade 11"], ["learning_goal", "What do you want to learn?", "e.g. Prepare for university entrance"],
  ["target_degree", "Target degree", "e.g. BS Computer Science"], ["preferred_language", "Preferred language", "English"],
  ["career_goal", "Career goal", "e.g. Become a data scientist"],
] as const;
export default function OnboardingForm({ initial }: { initial?: Record<string, unknown> | null }) {
  const [form, setForm] = useState<Record<string, string>>(() => Object.fromEntries(fields.map(([key]) => [key, String(initial?.[key] ?? "")] )));
  const [minutes, setMinutes] = useState(String(initial?.weekly_study_minutes ?? "300"));
  const [interests, setInterests] = useState(String((initial?.interests as string[] | undefined)?.join(", ") ?? ""));
  const [error, setError] = useState(""); const [pending, startTransition] = useTransition();
  function submit(e: React.FormEvent) { e.preventDefault(); setError(""); startTransition(async () => { const result = await completeOnboarding({ ...form, weekly_study_minutes: Number(minutes), interests: interests.split(",").map(x => x.trim()).filter(Boolean) } as OnboardingInput); if (!result.ok) setError(result.error); }); }
  return <form onSubmit={submit} className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[.04] p-6 shadow-2xl sm:p-10"><p className="mb-2 text-sm font-medium text-indigo-300">Welcome to EduForge AI</p><h1 className="text-3xl font-bold">Let&apos;s personalize your learning path</h1><p className="mt-2 text-slate-400">You can change these details later in Settings.</p><div className="mt-8 grid gap-5 sm:grid-cols-2">{fields.map(([key, label, placeholder]) => <label key={key} className="space-y-2"><span className="text-sm text-slate-300">{label}</span><input required value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-indigo-400" /></label>)}<label className="space-y-2"><span className="text-sm text-slate-300">Weekly study time (minutes)</span><input required type="number" min="30" max="10080" value={minutes} onChange={e => setMinutes(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white" /></label><label className="space-y-2"><span className="text-sm text-slate-300">Interests (comma-separated)</span><input value={interests} onChange={e => setInterests(e.target.value)} placeholder="math, robotics, writing" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white" /></label></div>{error && <p className="mt-5 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}<button disabled={pending} className="mt-8 rounded-xl bg-indigo-500 px-6 py-3 font-semibold text-white hover:bg-indigo-400 disabled:opacity-50">{pending ? "Saving…" : "Continue to dashboard"}</button></form>;
}
