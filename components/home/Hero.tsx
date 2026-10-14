"use client";

import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { Activity, ArrowRight, BookOpen, Brain, CircleDot, Cpu, FileText, Map, Mic, Play, Sparkles, Trophy } from "lucide-react";
import { ease, blurReveal } from "@/lib/motion";
import LiveChat from "./LiveChat";
import CrystalizedOrb from "./CrystalizedOrb";

const floatingCards = [
  { icon: Brain, label: "AI Tutor", tone: "cyan", x: -19, y: -29, delay: 0.3 },
  { icon: BookOpen, label: "Flashcards", tone: "amber", x: 30, y: -46, delay: 0.45 },
  { icon: Trophy, label: "Scholarships", tone: "amber", x: -39, y: 36, delay: 0.6 },
  { icon: Mic, label: "Voice Tutor", tone: "cyan", x: 48, y: 18, delay: 0.75 },
  { icon: FileText, label: "PDF Chat", tone: "cyan", x: -12, y: 70, delay: 0.9 },
  { icon: Map, label: "Roadmaps", tone: "amber", x: 40, y: 72, delay: 1.05 },
];

function FloatingPanel({ card, mouseX, mouseY, reduced }: { card: (typeof floatingCards)[0]; mouseX: ReturnType<typeof useMotionValue<number>>; mouseY: ReturnType<typeof useMotionValue<number>>; reduced: boolean | null }) {
  const x = useTransform(mouseX, (v) => v * 2.8);
  const y = useTransform(mouseY, (v) => v * 2.8);
  const accent = card.tone === "amber" ? "border-amber-300/25 bg-amber-300/[0.08] text-amber-100" : "border-cyan-300/25 bg-cyan-300/[0.08] text-cyan-100";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: reduced ? 0 : [0, -9, 0] }}
      transition={{ opacity: { delay: card.delay, duration: .55 }, scale: { delay: card.delay, duration: .55 }, y: reduced ? undefined : { delay: card.delay + .6, duration: 4, repeat: Infinity, ease: "easeInOut" } }}
      style={{ left: `${50 + card.x}%`, top: `${42 + card.y}%`, x: reduced ? 0 : x, y: reduced ? undefined : y }}
      className="absolute hidden sm:flex"
    >
      <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 shadow-[0_12px_30px_rgba(0,0,0,.4)] backdrop-blur-xl ${accent}`}>
        <card.icon className="h-3.5 w-3.5" />
        <span className="whitespace-nowrap text-[11px] font-semibold tracking-wide">{card.label}</span>
      </div>
    </motion.div>
  );
}

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 70, damping: 18 });
  const springY = useSpring(mouseY, { stiffness: 70, damping: 18 });
  const panelX = useTransform(springX, (v) => v * -18);
  const panelY = useTransform(springY, (v) => v * -12);
  const panelRotateY = useTransform(springX, (v) => v * 6);
  const panelRotateX = useTransform(springY, (v) => v * -4);

  const handleMouse = (e: React.MouseEvent) => {
    if (reduced || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <section ref={containerRef} onMouseMove={handleMouse} onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }} className="relative min-h-screen overflow-hidden pb-20 pt-28 lg:pb-28 lg:pt-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-[.9fr_1.1fr] lg:gap-4">
          <div className="relative z-10">
            <motion.div variants={blurReveal} initial="hidden" animate="show">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/[0.07] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Mission control for your learning <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_#ffc45c]" />
              </div>
              <h1 className="max-w-xl text-[3.25rem] font-bold leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl lg:text-[4.55rem]">
                Build your path to <span className="bg-gradient-to-r from-cyan-200 via-cyan-400 to-amber-300 bg-clip-text text-transparent">mastery.</span>
              </h1>
              <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-slate-400">
                Personalized AI tutoring, smart flashcards, scholarship matching, and adaptive study plans — all in one focused learning workspace.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link href="/signup" className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 px-5 py-3.5 text-sm font-bold text-[#031018] shadow-[0_0_34px_rgba(86,231,255,.26)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_48px_rgba(86,231,255,.42)]">
                  Start learning free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <button className="group inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-slate-200 transition-all hover:border-amber-300/35 hover:bg-amber-300/[0.06]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-300/40 text-amber-200"><Play className="h-3 w-3 fill-current" /></span> See how it works
                </button>
              </div>
              <div className="mt-10 flex items-center gap-3 text-xs text-slate-500"><span className="flex items-center gap-1.5 text-emerald-300"><CircleDot className="h-3.5 w-3.5" /> Free to start</span><span className="text-white/20">/</span><span>No credit card</span><span className="text-white/20">/</span><span>Private by design</span></div>
            </motion.div>
          </div>

          <div className="relative mx-auto w-full max-w-xl [perspective:1200px] lg:max-w-none">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[76%] w-[76%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-[70px]" />
            <motion.div initial={{ opacity: 0, scale: .86, y: 42 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 1, delay: .15, ease }} style={{ x: reduced ? 0 : panelX, y: reduced ? 0 : panelY, rotateY: reduced ? 0 : panelRotateY, rotateX: reduced ? 0 : panelRotateX, transformStyle: "preserve-3d" }} className="relative mx-auto aspect-square max-w-[560px]">
              {/* Crystalized learning orb: reactive energy rim, cracks, and bounded cursor-lit dust. */}
              <CrystalizedOrb mouseX={springX} mouseY={springY} reduced={reduced} />
              <div className="absolute inset-[8%] rounded-full border border-cyan-300/20 [transform:rotateX(66deg)_rotateZ(-14deg)]" />
              <div className="absolute inset-[17%] rounded-full border border-amber-300/25 [transform:rotateX(66deg)_rotateZ(34deg)]" />
              <div className="absolute left-[8%] top-[43%] h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_18px_#ffc45c]" />
              <div className="absolute right-[15%] top-[20%] h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_14px_#56e7ff]" />
              <div className="absolute left-1/2 top-[20%] h-[38%] w-[54%] -translate-x-1/2 rounded-[50%_50%_42%_42%] border border-cyan-100/35 bg-[radial-gradient(circle_at_34%_24%,#d9ffff_0,#54e2e7_10%,#14768f_35%,#08263c_72%)] shadow-[inset_-28px_-25px_48px_rgba(0,0,0,.62),0_0_70px_rgba(52,210,238,.38),0_0_140px_rgba(52,210,238,.12)] [transform:translateZ(20px)]">
                <div className="absolute inset-[12%] rounded-[50%] border border-cyan-100/20 border-dashed" />
                <div className="absolute left-[23%] top-[35%] h-2 w-2 rounded-full bg-amber-200 shadow-[0_0_16px_#ffd08a]" />
                <div className="absolute right-[24%] top-[28%] h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_14px_#bffaff]" />
              </div>
              <div className="absolute left-[26%] top-[52%] h-[29%] w-[5%] rounded-full border-l border-cyan-200/50 [transform:rotate(11deg)_translateZ(16px)]" />
              <div className="absolute left-[38%] top-[51%] h-[35%] w-[5%] rounded-full border-l border-cyan-200/35 [transform:rotate(4deg)_translateZ(16px)]" />
              <div className="absolute left-[51%] top-[52%] h-[38%] w-[5%] rounded-full border-l border-amber-200/35 [transform:rotate(-5deg)_translateZ(16px)]" />
              <div className="absolute left-[64%] top-[52%] h-[31%] w-[5%] rounded-full border-l border-cyan-200/45 [transform:rotate(-13deg)_translateZ(16px)]" />

              <div className="absolute left-[12%] top-[23%] h-[54%] w-[76%] overflow-hidden rounded-2xl border border-cyan-200/20 bg-[#071522]/90 p-5 shadow-[0_30px_70px_rgba(0,0,0,.55),inset_0_1px_rgba(255,255,255,.12)] backdrop-blur-xl [transform:translateZ(55px)]" aria-label="Learning command center preview">
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3"><div className="flex items-center gap-2"><Cpu className="h-4 w-4 text-cyan-300" /><span className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-100">Learning command center</span></div><span className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-emerald-300"><Activity className="h-3 w-3" /> Live</span></div>
                <LiveChat />
                <div className="mt-4 grid grid-cols-3 gap-2">{[{ label: "Streak", value: "12d", icon: Trophy }, { label: "Mastered", value: "84%", icon: Brain }, { label: "Focus", value: "2.4h", icon: Activity }].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-2"><Icon className="mb-1 h-3 w-3 text-amber-300" /><p className="text-sm font-bold text-white">{value}</p><p className="text-[9px] text-slate-500">{label}</p></div>)}</div>
                <div className="mt-4 flex items-center gap-2 text-[9px] text-slate-500"><div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[72%] rounded-full bg-gradient-to-r from-cyan-400 to-amber-300" /></div> next checkpoint 72%</div>
              </div>
              {floatingCards.map((card) => <FloatingPanel key={card.label} card={card} mouseX={springX} mouseY={springY} reduced={reduced} />)}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
