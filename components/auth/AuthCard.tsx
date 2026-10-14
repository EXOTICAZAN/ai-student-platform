"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ReactNode } from "react";
import { ease } from "@/lib/motion";
import AuthBackground from "./AuthBackground";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      <AuthBackground />

      <motion.div
        initial={{ opacity: 0, y: 32, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.75, ease }}
        className="relative w-full max-w-[420px]"
      >
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/35">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">
            EduForge<span className="text-indigo-400">AI</span>
          </span>
        </Link>

        <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-white/[0.09] to-white/[0.02] p-8 shadow-[0_32px_64px_rgba(0,0,0,0.45),0_0_80px_rgba(99,102,241,0.1)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-indigo-500/20 via-transparent to-purple-500/12 opacity-70" />

          <div className="relative text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.65rem]">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{subtitle}</p>
          </div>

          <div className="relative mt-8">{children}</div>
        </div>
      </motion.div>
    </div>
  );
}
