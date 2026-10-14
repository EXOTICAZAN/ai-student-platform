"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ease } from "@/lib/motion";

export default function CTA() {
  return (
    <section className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 36, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
          className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-gradient-to-br from-cyan-500/18 via-blue-500/12 to-amber-500/10 px-8 py-16 text-center shadow-[0_0_80px_rgba(86,231,255,0.14)] sm:px-16 lg:py-24"
        >
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/25 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/30 blur-[100px]" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />

          <h2 className="relative text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Start Learning
            <br />
            <span className="bg-gradient-to-r from-cyan-200 via-cyan-300 to-amber-200 bg-clip-text text-transparent">
              Smarter Today
            </span>
          </h2>
          <p className="relative mx-auto mt-6 max-w-xl text-lg text-slate-300">
            One workspace for tutoring, notes, flashcards, quizzes, planning and scholarships — free to start.
          </p>
          <div className="relative mt-12 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-amber-400 px-9 py-4 text-base font-semibold text-white shadow-[0_0_48px_rgba(99,102,241,0.4)] transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_0_64px_rgba(99,102,241,0.55)]"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="#features"
              className="rounded-full border border-white/20 bg-white/[0.05] px-9 py-4 text-base font-medium text-white backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-white/10"
            >
              Explore Features
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
