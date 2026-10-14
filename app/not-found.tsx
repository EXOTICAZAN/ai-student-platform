import Link from "next/link";
import { Compass, HelpCircle, Home, Search } from "lucide-react";

export const metadata = {
  title: "Page not found — EduForge AI",
};

const LINKS = [
  { href: "/", label: "Home", icon: Home, description: "Back to the start" },
  { href: "/dashboard", label: "Dashboard", icon: Compass, description: "Your study overview" },
  { href: "/help", label: "Help Center", icon: HelpCircle, description: "Answers to common questions" },
];

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050816] px-6 py-20 text-center">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[46rem] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-[130px]" />

      <div className="relative">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-500/25">
          <Search className="h-6 w-6 text-indigo-300" />
        </div>

        <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.18em] text-indigo-400">
          Error 404
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          This page went
          <span className="text-gradient"> off syllabus</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-slate-400">
          The link may be outdated, or the page may have moved. Try one of these instead.
        </p>

        <div className="mt-9 grid gap-3 sm:grid-cols-3">
          {LINKS.map(({ href, label, icon: Icon, description }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-indigo-500/40 hover:bg-white/[0.05]"
            >
              <Icon className="h-4 w-4 text-indigo-400 transition-transform group-hover:scale-110" />
              <p className="mt-2.5 text-sm font-semibold text-white group-hover:text-indigo-300">
                {label}
              </p>
              <p className="mt-0.5 text-[12px] text-slate-500">{description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
