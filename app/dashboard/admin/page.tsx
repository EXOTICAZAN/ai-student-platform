import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import DashboardShell from "@/components/dashboard/DashboardShell";
export default async function AdminPage() {
  const { supabase, user } = await getAdminUser();
  if (!user) { const { data: auth } = await supabase.auth.getUser(); if (!auth.user) redirect("/login"); return <Forbidden />; }
  // Service-role client is used only after the server-side allowlist check, so admin metrics are aggregate-only and never expose secrets.
  const metricsClient = createAdminClient() ?? supabase;
  const counts = await Promise.all(["profiles", "notes", "courses", "scholarships"].map(async table => { const { count } = await metricsClient.from(table).select("id", { count: "exact", head: true }); return [table, count ?? 0] as const; }));
  return <DashboardShell userName={user.email ?? "Admin"} userEmail={user.email}><div className="mx-auto max-w-6xl space-y-6"><div><p className="text-sm text-indigo-300">Administration</p><h1 className="text-3xl font-bold text-white">Platform overview</h1><p className="mt-2 text-slate-400">Safe, read-only operational metrics for the current workspace.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{counts.map(([name, count]) => <div key={name} className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><p className="text-sm capitalize text-slate-400">{name}</p><p className="mt-2 text-3xl font-bold text-white">{count}</p></div>)}</div><div className="grid gap-4 md:grid-cols-3">{["Scholarship management", "Course management", "Content management"].map(title => <div key={title} className="rounded-2xl border border-dashed border-white/15 bg-white/[.02] p-6"><h2 className="font-semibold text-white">{title}</h2><p className="mt-2 text-sm text-slate-400">Management controls will be added here after the moderation and audit model is defined.</p><span className="mt-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">Coming soon</span></div>)}</div></div></DashboardShell>;
}
function Forbidden() { return <main className="flex min-h-screen items-center justify-center bg-[#050816] px-6 text-center text-white"><div><p className="text-sm font-semibold uppercase tracking-wider text-red-300">403 Forbidden</p><h1 className="mt-3 text-3xl font-bold">Admin access required</h1><p className="mt-3 text-slate-400">Your account is authenticated but is not authorized to view this page.</p></div></main>; }
