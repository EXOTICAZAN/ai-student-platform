"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { ease } from "@/lib/motion";

// Billing is not built. Only the Free plan is real; the others are labelled as planned.
const plans = [
  {
    name: "Free",
    price: "$0",
    blurb: "Everything that exists today.",
    cta: { label: "Get started free", href: "/signup" },
    featured: true,
    status: "Available now",
    features: [
      "AI tutor with PDF chat and citations",
      "AI notes, flashcards (SM-2) and quizzes",
      "Study planner and 90-day analytics",
      "Scholarship search, matching and tracker",
      "Private by design: row-level data isolation",
    ],
  },
  {
    name: "Pro",
    price: "TBD",
    blurb: "Higher limits for heavy users.",
    cta: { label: "Tell us what you need", href: "/contact" },
    featured: false,
    status: "Planned",
    features: ["Higher AI usage limits", "Larger document uploads", "Voice tutor and learning roadmaps", "Priority support"],
  },
  {
    name: "Campus",
    price: "Talk to us",
    blurb: "For classes, clubs and universities.",
    cta: { label: "Get in touch", href: "/contact" },
    featured: false,
    status: "Planned",
    features: ["Shared decks and course material", "Educator dashboard", "Single sign-on", "Dedicated onboarding"],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="relative scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-cyan-300">Pricing</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Free while we
            <span className="bg-gradient-to-r from-cyan-300 to-amber-300 bg-clip-text text-transparent"> build in the open</span>
          </h2>
          <p className="mt-5 text-base text-slate-400">No card, no trial clock. Paid plans are on the roadmap and clearly marked as planned.</p>
        </motion.div>

        <div className="mt-14 grid items-stretch gap-5 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, ease }}
              whileHover={{ y: -6 }}
              className={
                plan.featured
                  ? "relative flex flex-col overflow-hidden rounded-3xl border border-cyan-300/35 bg-gradient-to-b from-cyan-500/15 to-amber-500/10 p-8 shadow-[0_0_80px_-20px_rgba(86,231,255,0.34)]"
                  : "relative flex flex-col overflow-hidden rounded-3xl border border-cyan-100/[0.10] bg-[#071b2a]/65 shadow-[inset_0_1px_rgba(255,255,255,.08),0_18px_60px_rgba(0,0,0,.18)] p-8"
              }
            >
              {plan.featured && <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/25 blur-3xl" />}
              <div className="relative flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <span className={plan.featured ? "rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300" : "rounded-full bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300"}>
                  {plan.status}
                </span>
              </div>
              <p className="relative mt-5 text-5xl font-bold tracking-tight text-white">{plan.price}</p>
              <p className="relative mt-2 text-sm text-slate-400">{plan.blurb}</p>
              <ul className="relative mt-7 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.cta.href}
                className={
                  plan.featured
                    ? "group relative mt-8 inline-flex items-center justify-center gap-2 rounded-full btn-gradient px-6 py-3.5 text-sm font-semibold shadow-[0_0_40px_rgba(86,231,255,0.3)] transition-transform hover:scale-[1.03]"
                    : "group relative mt-8 inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                }
              >
                {plan.cta.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
