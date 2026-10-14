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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      toast.error(authError.message);
      setLoading(false);
      return;
    }

    toast.success("Welcome back!");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to continue your learning journey">
      <SocialButtons />
      <AuthDivider />

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
        <AuthInput
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-[13px] font-medium text-indigo-400 transition-colors hover:text-indigo-300"
          >
            Forgot password?
          </Link>
        </div>

        {error && (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-[13px] text-rose-400" role="alert">
            {error}
          </p>
        )}

        <AuthSubmit loading={loading}>Sign In</AuthSubmit>
      </form>

      <p className="mt-6 text-center text-[13px] text-slate-400">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-indigo-400 transition-colors hover:text-indigo-300">
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
}
