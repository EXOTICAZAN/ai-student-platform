"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Layers, Cpu, ShieldCheck, LineChart } from "lucide-react";
import { ease } from "@/lib/motion";

// Every figure here is a verifiable fact about the codebase, not marketing.
const stats = [
  { value: 8, suffix: "", label: "Study tools, one workspace", note: "Tutor · notes · cards · quizzes · planner · scholarships · analytics · search", icon: Layers },
  { value: 384, suffix: "-d", label: "Embeddings computed locally", note: "Your documents never reach a third-party embedding API", icon: Cpu },
  { value: 100, suffix: "%", label: "Per-user data isolation", note: "Row Level Security on every table that holds your data", icon: ShieldCheck },
  { value: 90, suffix: " days", label: "Of progress history", note: "XP, minutes, quiz accuracy and retention in one source of truth", icon: LineChart },
];

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (!inView) return;
    const duration = 1600;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {count}
      <span className="text-2xl text-cyan-200 sm:text-3xl">{suffix}</span>
    </span>
  );
}

export default function Stats() {
  return (
    <section className="relative py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, ease }}
              className="group relative overflow-hidden rounded-2xl border border-cyan-100/[0.10] bg-[#071b2a]/65 shadow-[inset_0_1px_rgba(255,255,255,.08),0_18px_60px_rgba(0,0,0,.18)] p-6 transition-colors hover:border-cyan-300/30 hover:bg-white/[0.05]"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
              <stat.icon className="h-5 w-5 text-cyan-300" />
              <p className="mt-5 text-5xl font-bold tracking-tight text-white">
                <Counter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-200">{stat.label}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{stat.note}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
