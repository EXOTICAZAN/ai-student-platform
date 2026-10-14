"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import AuthCard from "@/components/auth/AuthCard";
import AuthInput from "@/components/auth/AuthInput";
import AuthSubmit from "@/components/auth/AuthSubmit";
import { CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
    });

    if (resetError) {
      setError(resetError.message);
      toast.error(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
    toast.success("Check your email for a reset link");
  };

  if (sent) {
    return (
      <AuthCard title="Check your email" subtitle="We sent a reset link if an account exists">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
          </div>
          <p className="text-sm text-slate-400">
            If <span className="text-white">{email}</span> is registered, you&apos;ll receive a
            password reset link shortly.
          </p>
          <Link
            href="/login"
            className="mt-2 text-[13px] font-medium text-indigo-400 hover:text-indigo-300"
          >
            Back to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset password" subtitle="Enter your email and we'll send a reset link">
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthInput
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {error && (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-[13px] text-rose-400" role="alert">
            {error}
          </p>
        )}

        <AuthSubmit loading={loading}>Send Reset Link</AuthSubmit>
      </form>

      <p className="mt-6 text-center text-[13px] text-slate-400">
        Remember your password?{" "}
        <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
