"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CheckCircle2, Circle, Lock, Award } from "lucide-react";
import { ease } from "@/lib/motion";

const nodes = [
  { title: "Foundations", desc: "Linear Algebra · Probability · Python", status: "done" },
  { title: "Machine Learning", desc: "Supervised · Unsupervised · Evaluation", status: "done" },
  { title: "Deep Learning", desc: "Neural Nets · CNNs · Transformers", status: "active" },
  { title: "Projects", desc: "Build · Deploy · Portfolio", status: "next" },
  { title: "Career", desc: "Interviews · Scholarships · Roles", status: "locked" },
];

export default function Roadmap() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="ai-tutor" className="relative scroll-mt-24 py-24 lg:py-32" ref={ref}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Learning Path
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            From zero to
            <span className="bg-gradient-to-r from-cyan-300 to-amber-300 bg-clip-text text-transparent">
              {" "}AI Engineer
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-400">
            A living roadmap that builds itself as you progress.
          </p>
        </motion.div>

        <div className="relative mx-auto mt-16 max-w-3xl">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-400/50 via-cyan-300/25 to-transparent sm:left-1/2 sm:-translate-x-px" />

          <div className="space-y-10">
            {nodes.map((node, i) => {
              const isDone = node.status === "done";
              const isActive = node.status === "active";
              const isLocked = node.status === "locked";

              return (
                <motion.div
                  key={node.title}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.55, delay: 0.12 * i, ease }}
                  className={`relative flex items-start gap-5 sm:gap-0 ${
                    i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
                  }`}
                >
                  {/* Node dot */}
                  <div className="absolute left-6 z-10 flex h-12 w-12 -translate-x-1/2 items-center justify-center sm:left-1/2">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        isDone
                          ? "border-emerald-400 bg-emerald-500/20"
                          : isActive
                          ? "border-cyan-300 bg-cyan-400/20 shadow-[0_0_28px_rgba(86,231,255,0.38)]"
                          : "border-white/15 bg-white/5"
                      }`}
                    >
                      {isDone && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                      {isActive && <Circle className="h-5 w-5 text-cyan-300" />}
                      {(node.status === "next" || isLocked) && (
                        <Lock className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Card */}
                  <div
                    className={`ml-16 w-full rounded-2xl border p-5 sm:ml-0 sm:w-[calc(50%-2.5rem)] ${
                      isActive
                        ? "border-cyan-400/30 bg-cyan-400/10"
                        : "border-cyan-100/[0.10] bg-[#071b2a]/65"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-semibold text-white">{node.title}</h3>
                      {isActive && (
                        <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-medium text-cyan-200">
                          In progress
                        </span>
                      )}
                      {isDone && <Award className="h-4 w-4 text-emerald-400" />}
                    </div>
                    <p className="mt-1.5 text-[13px] text-slate-400">{node.desc}</p>
                    {isActive && (
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={inView ? { width: "62%" } : {}}
                          transition={{ duration: 1.2, delay: 0.4, ease }}
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-300"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
