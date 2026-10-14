"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthCard from "@/components/auth/AuthCard";
import { Mail } from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your email";

  return (
    <AuthCard title="Verify your email" subtitle="One more step to unlock EduForge AI">
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/15 shadow-[0_0_32px_rgba(99,102,241,0.25)]">
          <Mail className="h-8 w-8 text-indigo-400" />
        </div>

        <p className="text-sm leading-relaxed text-slate-400">
          We sent a verification link to{" "}
          <span className="font-medium text-white">{email}</span>. Click the link to activate
          your account.
        </p>

        <div className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] text-slate-400">
          Didn&apos;t get it? Check spam, or wait a minute and try again.
        </div>

        <Link
          href="/login"
          className="text-[13px] font-medium text-indigo-400 transition-colors hover:text-indigo-300"
        >
          Back to sign in
        </Link>
      </div>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Verify your email" subtitle="Loading…">
          <div className="h-32 animate-pulse rounded-xl bg-white/5" />
        </AuthCard>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
