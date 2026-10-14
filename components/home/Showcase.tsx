"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  BookOpen,
  Trophy,
  Calendar,
  BarChart3,
  Map,
  Award,
  Bell,
  Zap,
} from "lucide-react";
import { ease } from "@/lib/motion";

const tabs = [
  { id: "chat", label: "AI Chat", icon: MessageSquare },
  { id: "progress", label: "Progress", icon: BarChart3 },
  { id: "roadmap", label: "Roadmap", icon: Map },
  { id: "calendar", label: "Planner", icon: Calendar },
];

const notifications = [
  { icon: Trophy, text: "Scholarship match · 94%", color: "text-amber-400" },
  { icon: Award, text: "12-day streak unlocked", color: "text-emerald-400" },
  { icon: Zap, text: "Quiz completed · +50 XP", color: "text-cyan-300" },
];

export default function Showcase() {
  const [xp, setXp] = useState(1240);
  const [notifIndex, setNotifIndex] = useState(0);

  useEffect(() => {
    const xpTimer = setInterval(() => {
      setXp((v) => v + Math.floor(Math.random() * 3) + 1);
    }, 2800);
    const notifTimer = setInterval(() => {
      setNotifIndex((i) => (i + 1) % notifications.length);
    }, 3500);
    return () => {
      clearInterval(xpTimer);
      clearInterval(notifTimer);
    };
  }, []);

  return (
    <section className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Platform Preview
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            A dashboard built for
            <span className="bg-gradient-to-r from-cyan-300 to-amber-300 bg-clip-text text-transparent">
              {" "}deep focus
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-400">
            Live progress, real-time AI, and achievements — always updating.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: 0.15, ease }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          {/* Floating notification toast */}
          <div className="absolute -top-4 right-4 z-20 hidden sm:block">
            <AnimatePresence mode="wait">
              <motion.div
                key={notifIndex}
                initial={{ opacity: 0, y: -12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.35 }}
                className="flex items-center gap-2.5 rounded-xl border border-white/12 bg-[#061522]/95 px-4 py-2.5 shadow-xl backdrop-blur-xl"
              >
                {(() => {
                  const n = notifications[notifIndex];
                  const Icon = n.icon;
                  return (
                    <>
                      <Icon className={`h-4 w-4 ${n.color}`} />
                      <span className="text-[12px] text-slate-200">{n.text}</span>
                    </>
                  );
                })()}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-b from-white/[0.07] to-white/[0.02] shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400/70" />
                  <div className="h-3 w-3 rounded-full bg-amber-400/70" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400/70" />
                </div>
                <div className="ml-4 h-2.5 w-40 rounded-full bg-white/10" />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-lg bg-cyan-400/15 px-2.5 py-1 text-[11px] font-medium text-cyan-200">
                  <Zap className="h-3 w-3" />
                  <motion.span key={xp}>{xp.toLocaleString()} XP</motion.span>
                </div>
                <div className="relative">
                  <Bell className="h-4 w-4 text-slate-400" />
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-rose-500" />
                </div>
                <div className="hidden gap-2 sm:flex">
                  {tabs.map((tab) => (
                    <div
                      key={tab.id}
                      className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-400"
                    >
                      <tab.icon className="h-3.5 w-3.5" />
                      <span className="hidden md:inline">{tab.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-12">
              {/* Sidebar */}
              <div className="hidden border-r border-white/8 p-5 lg:col-span-3 lg:block">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Courses
                </p>
                {[
                  { name: "Quantum Physics", progress: 72 },
                  { name: "Linear Algebra", progress: 45 },
                  { name: "Machine Learning", progress: 88 },
                  { name: "Organic Chemistry", progress: 31 },
                ].map((course) => (
                  <div key={course.name} className="mb-4">
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="text-slate-300">{course.name}</span>
                      <span className="text-slate-500">{course.progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${course.progress}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.1, delay: 0.25, ease }}
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-300"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Main */}
              <div className="p-6 lg:col-span-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/15">
                    <MessageSquare className="h-5 w-5 text-cyan-300" />
                  </div>
                  <div>
                    <p className="font-medium text-white">AI Tutor Session</p>
                    <p className="text-xs text-slate-500">Quantum Physics · 14 min</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl rounded-tl-md bg-white/6 px-4 py-3 text-sm text-slate-300">
                    Can you explain the uncertainty principle with an everyday analogy?
                  </div>
                  <div className="rounded-2xl rounded-tl-md bg-gradient-to-br from-cyan-400/15 to-amber-400/10 px-4 py-3 text-sm leading-relaxed text-slate-200">
                    Think of a butterfly in a dark room. The more precisely you try to locate it with a flashlight, the more you disturb its flight path. Measuring position or momentum always disturbs the other.
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <input
                    readOnly
                    placeholder="Ask anything…"
                    className="flex-1 bg-transparent text-sm text-slate-400 outline-none placeholder:text-slate-500"
                  />
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/25">
                    <MessageSquare className="h-4 w-4 text-cyan-200" />
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="hidden border-l border-white/8 p-5 lg:col-span-3 lg:block">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Today
                </p>
                <div className="space-y-3">
                  {[
                    { icon: BookOpen, label: "Flashcards", time: "25 min" },
                    { icon: Trophy, label: "Scholarship match", time: "New" },
                    { icon: Award, label: "Streak milestone", time: "12 days" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-3 py-2.5"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/8">
                        <item.icon className="h-4 w-4 text-slate-300" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-200">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
