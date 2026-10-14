"use client";

import { motion } from "framer-motion";
import { blurReveal, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  titleAccent?: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function PageHero({
  eyebrow,
  title,
  titleAccent,
  description,
  className,
  children,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden pt-16 pb-14 lg:pt-24 lg:pb-16",
        className
      )}
    >
      <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          variants={blurReveal}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-indigo-400">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {title}
            {titleAccent && <span className="text-gradient"> {titleAccent}</span>}
          </h1>
          {description && (
            <motion.p variants={fadeUp} className="mt-5 text-lg leading-relaxed text-slate-400">
              {description}
            </motion.p>
          )}
          {children && (
            <motion.div variants={fadeUp} className="mt-8">
              {children}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
