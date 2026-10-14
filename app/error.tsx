"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCw } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  // Next.js does not surface render errors to the console on its own in
  // production, so without this the digest is the only clue left behind.
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050816] px-6 py-20 text-center">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[46rem] -translate-x-1/2 rounded-full bg-rose-500/10 blur-[130px]" />

      <div className="relative">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 ring-1 ring-rose-500/25">
          <AlertTriangle className="h-6 w-6 text-rose-300" />
        </div>

        <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.18em] text-rose-400">
          Something broke
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          This page hit
          <span className="text-gradient"> an error</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-slate-400">
          Nothing you did caused this. Try again, and if it keeps happening head
          back to safety.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
          >
            <RotateCw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/30 hover:bg-white/[0.08]"
          >
            <Home className="h-4 w-4" />
            Back home
          </Link>
        </div>

        {error.digest ? (
          <p className="mt-8 text-[12px] text-slate-600">
            Reference code: {error.digest}
          </p>
        ) : null}
      </div>
    </div>
  );
}
