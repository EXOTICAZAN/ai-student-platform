"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import AuthCard from "@/components/auth/AuthCard";
import AuthInput from "@/components/auth/AuthInput";
import AuthSubmit from "@/components/auth/AuthSubmit";
import SocialButtons from "@/components/auth/SocialButtons";
import AuthDivider from "@/components/auth/AuthDivider";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (authError) {
      setError(authError.message);
      toast.error(authError.message);
      setLoading(false);
      return;
    }

    toast.success("Account created! Check your email to verify.");
    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  };

  return (
    <AuthCard title="Create your account" subtitle="Start learning smarter in under a minute">
      <SocialButtons />
      <AuthDivider />

      <form onSubmit={onSubmit} className="space-y-4">
        <AuthInput
          label="Full name"
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder="Ayesha Khan"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
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
        <AuthInput
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <AuthInput
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          error={error && error.includes("match") ? error : undefined}
        />

        {error && !error.includes("match") && (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-[13px] text-rose-400" role="alert">
            {error}
          </p>
        )}

        <AuthSubmit loading={loading}>Create Account</AuthSubmit>
      </form>

      <p className="mt-6 text-center text-[13px] text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-400 transition-colors hover:text-indigo-300">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
