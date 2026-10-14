"use client";

import { motion } from "framer-motion";
import { FileUp, Scissors, Cpu, Database, Sparkles, BookMarked, Lock, Repeat } from "lucide-react";
import { ease } from "@/lib/motion";

const pipeline = [
  { icon: FileUp, title: "Upload", text: "Drop in a PDF: lecture slides, a paper, a textbook chapter." },
  { icon: Scissors, title: "Chunk", text: "Text is split into overlapping passages that keep context intact." },
  { icon: Cpu, title: "Embed locally", text: "MiniLM vectors are computed on the server. Nothing leaves it." },
  { icon: Database, title: "Retrieve", text: "pgvector finds the passages closest to your question." },
  { icon: Sparkles, title: "Answer", text: "The model replies from your material, with citations." },
];

const principles = [
  { icon: BookMarked, title: "Grounded in your material", text: "Answers about your documents come from your documents, with sources you can check, not from a model's guess." },
  { icon: Lock, title: "Private by design", text: "Row Level Security isolates every user's data at the database, and embeddings run in-process instead of through a third party." },
  { icon: Repeat, title: "Learning science, not gimmicks", text: "Flashcards use the SM-2 spaced-repetition algorithm, so you review what you are about to forget." },
];

const stack = ["Next.js 16", "React 19", "TypeScript", "Supabase", "pgvector", "Groq", "transformers.js", "Tailwind v4", "Framer Motion"];

export default function About() {
  return (
    <section id="about" className="relative scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-cyan-300">About</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            A study companion that
            <span className="bg-gradient-to-r from-cyan-300 to-amber-300 bg-clip-text text-transparent"> shows its work</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-slate-400">
            Students juggle five tools to study one subject. EduForge AI puts tutoring, notes, practice,
            planning and funding in a single place, and every AI answer is grounded in your own material.
          </p>
        </motion.div>

        {/* RAG pipeline */}
        <div className="relative mt-16">
          <div className="pointer-events-none absolute left-0 right-0 top-[34px] hidden h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent lg:block" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {pipeline.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.09, ease }}
                className="relative rounded-2xl border border-white/[0.08] bg-[#061b2a]/80 p-5 backdrop-blur"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_30px_-6px_rgba(86,231,255,0.7)]">
                  <step.icon className="h-5 w-5 text-white" />
                </div>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Step {i + 1}</p>
                <h3 className="mt-1 text-[15px] font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Principles */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {principles.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.08, ease }}
              whileHover={{ y: -5 }}
              className="rounded-2xl border border-cyan-100/[0.10] bg-[#071b2a]/65 shadow-[inset_0_1px_rgba(255,255,255,.08),0_18px_60px_rgba(0,0,0,.18)] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
            >
              <p.icon className="h-5 w-5 text-cyan-300" />
              <h3 className="mt-4 text-base font-semibold text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.text}</p>
            </motion.div>
          ))}
        </div>

        {/* Stack */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5">
          {stack.map((t) => (
            <span key={t} className="rounded-full border border-cyan-100/[0.10] bg-white/[0.045] px-3.5 py-1.5 text-xs font-medium text-slate-300">
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
