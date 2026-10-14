"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Trophy,
  HelpCircle,
  Layers,
  Calendar,
  Mic,
  FileText,
  Map,
  NotebookPen,
  UserCheck,
} from "lucide-react";
import { ease, stagger } from "@/lib/motion";
import FlipCard from "./FlipCard";
import ThoughtLine from "./ThoughtLine";

type Feature =
  | {
      icon: typeof Brain;
      title: string;
      description: string;
      gradient: string;
      demo: {
        type: "chat";
        lines: [string, string];
      };
    }
  | {
      icon: typeof Trophy;
      title: string;
      description: string;
      gradient: string;
      demo: {
        type: "match";
        score: string;
        name: string;
      };
    }
  | {
      icon: typeof HelpCircle;
      title: string;
      description: string;
      gradient: string;
      demo: {
        type: "quiz";
        q: string;
        a: string;
      };
    }
  | {
      icon: typeof Layers;
      title: string;
      description: string;
      gradient: string;
      demo: {
        type: "card";
        front: string;
        back: string;
      };
    }
  | {
      icon: typeof Calendar;
      title: string;
      description: string;
      gradient: string;
      demo: {
        type: "plan";
        next: string;
      };
    }
  | {
      icon: typeof Mic;
      title: string;
      description: string;
      gradient: string;
      demo: {
        type: "voice";
      };
    }
  | {
      icon: typeof FileText;
      title: string;
      description: string;
      gradient: string;
      demo: {
        type: "pdf";
        status: string;
      };
    }
  | {
      icon: typeof Map;
      title: string;
      description: string;
      gradient: string;
      demo: {
        type: "road";
        steps: number;
      };
    }
  | {
      icon: typeof NotebookPen;
      title: string;
      description: string;
      gradient: string;
      demo: {
        type: "notes";
      };
    }
  | {
      icon: typeof UserCheck;
      title: string;
      description: string;
      gradient: string;
      demo: {
        type: "score";
        value: string;
      };
    };

const features: Feature[] = [
  {
    icon: Brain,
    title: "AI Tutor",
    description:
      "24/7 personalized tutoring that adapts to your learning style and pace.",
    gradient: "from-cyan-400 to-blue-500",
    demo: {
      type: "chat",
      lines: ["What is gravity?", "A force that pulls…"],
    },
  },
  {
    icon: Trophy,
    title: "Scholarship Finder",
    description:
      "Discover and match with scholarships tailored to your profile and goals.",
    gradient: "from-amber-400 to-orange-500",
    demo: {
      type: "match",
      score: "94%",
      name: "STEM Excellence",
    },
  },
  {
    icon: HelpCircle,
    title: "Quiz Generator",
    description:
      "Instant adaptive quizzes from any topic or uploaded material.",
    gradient: "from-emerald-500 to-teal-500",
    demo: {
      type: "quiz",
      q: "What is 2πr?",
      a: "Circumference",
    },
  },
  {
    icon: Layers,
    title: "Smart Flashcards",
    description:
      "Spaced-repetition flashcards generated automatically from your notes.",
    gradient: "from-cyan-500 to-teal-400",
    demo: {
      type: "card",
      front: "Mitochondria",
      back: "Powerhouse of cell",
    },
  },
  {
    icon: Calendar,
    title: "Study Planner",
    description:
      "AI-crafted weekly schedules that balance depth and retention.",
    gradient: "from-cyan-400 to-sky-500",
    demo: {
      type: "plan",
      next: "Physics · 2.5h",
    },
  },
  {
    icon: Mic,
    title: "Voice Tutor",
    description:
      "Speak and listen — practice concepts through natural conversation.",
    gradient: "from-amber-400 to-rose-500",
    demo: {
      type: "voice",
    },
  },
  {
    icon: FileText,
    title: "Chat with PDF",
    description:
      "Upload any document and ask questions as if the author is there.",
    gradient: "from-cyan-500 to-blue-500",
    demo: {
      type: "pdf",
      status: "Summary ready",
    },
  },
  {
    icon: Map,
    title: "Learning Roadmaps",
    description:
      "Clear, step-by-step paths from beginner to mastery in any field.",
    gradient: "from-sky-400 to-cyan-500",
    demo: {
      type: "road",
      steps: 4,
    },
  },
  {
    icon: NotebookPen,
    title: "AI Notes",
    description:
      "Auto-summarize lectures and generate structured, searchable notes.",
    gradient: "from-teal-400 to-cyan-400",
    demo: {
      type: "notes",
    },
  },
  {
    icon: UserCheck,
    title: "Interview Coach",
    description:
      "Practice technical and behavioral interviews with real-time feedback.",
    gradient: "from-amber-400 to-rose-400",
    demo: {
      type: "score",
      value: "8.4/10",
    },
  },
];

// Shown honestly on the landing page: these three are on the roadmap, not shipped.
const COMING_SOON = new Set(["Voice Tutor", "Learning Roadmaps", "Interview Coach"]);

function MiniDemo({ demo }: { demo: Feature["demo"] }) {
  if (demo.type === "chat") {
    return (
      <div className="space-y-1.5 text-[10px]">
        <div className="rounded-md bg-white/10 px-2 py-1 text-slate-300">
          {demo.lines[0]}
        </div>
        <div className="rounded-md bg-cyan-400/15 px-2 py-1 text-cyan-100">
          {demo.lines[1]}
        </div>
      </div>
    );
  }

  if (demo.type === "match") {
    return (
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="truncate text-slate-300">{demo.name}</span>
        <span className="font-semibold text-emerald-400">
          {demo.score}
        </span>
      </div>
    );
  }

  if (demo.type === "quiz") {
    return (
      <div className="space-y-1 text-[11px]">
        <div className="text-slate-300">{demo.q}</div>
        <div className="text-emerald-400">
          → {demo.a}
        </div>
      </div>
    );
  }

  if (demo.type === "card") {
    return (
      <div className="space-y-1 text-[11px]">
        <div className="font-medium text-cyan-100">
          {demo.front}
        </div>
        <div className="text-slate-400">
          {demo.back}
        </div>
      </div>
    );
  }

  if (demo.type === "plan") {
    return (
      <div className="text-[11px] text-sky-300">
        Next: {demo.next}
      </div>
    );
  }

  if (demo.type === "voice") {
    return (
      <div className="flex h-6 items-center justify-center gap-1">
        {[3, 6, 4, 8, 5, 7, 3].map((h, i) => (
          <motion.div
            key={i}
            className="w-0.5 rounded-full bg-rose-400"
            animate={{ height: [h, h + 4, h] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.08,
            }}
            style={{ height: h }}
          />
        ))}
      </div>
    );
  }

  if (demo.type === "pdf") {
    return (
      <div className="text-[11px] text-cyan-200">
        ✓ {demo.status}
      </div>
    );
  }

  if (demo.type === "road") {
    return (
      <div className="flex gap-1">
        {Array.from({ length: demo.steps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < 2 ? "bg-cyan-300" : "bg-white/15"
            }`}
          />
        ))}
      </div>
    );
  }

  if (demo.type === "score") {
    return (
      <div className="text-center text-[13px] font-semibold text-amber-200">
        {demo.value}
      </div>
    );
  }

  return (
    <div className="text-[11px] text-teal-300">
      Notes generated
    </div>
  );
}

const item = {
  hidden: {
    opacity: 0,
    y: 28,
    filter: "blur(6px)",
  },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.55,
      ease,
    },
  },
};

export default function Features() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section id="features" className="relative scroll-mt-24 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{
            once: true,
            margin: "-80px",
          }}
          transition={{
            duration: 0.7,
            ease,
          }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="mb-3 text-sm font-medium text-cyan-300">
            Features
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything you need to{" "}
            <span className="text-cyan-300">
              learn smarter
            </span>
          </h2>

          <p className="mt-4 text-sm text-slate-400">
            Hover any card to see it come alive.
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{
            once: true,
            margin: "-60px",
          }}
          className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              onHoverStart={() =>
                setHovered(feature.title)
              }
              onHoverEnd={() => setHovered(null)}
              whileHover={{
                y: -8,
                transition: {
                  duration: 0.3,
                  ease,
                },
              }}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.05]"
            >
              {COMING_SOON.has(feature.title) && (
                <span className="absolute right-3 top-3 rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
                  Soon
                </span>
              )}
              <div className="pointer-events-none absolute -inset-px rounded-2xl bg-[radial-gradient(400px_circle_at_50%_0%,rgba(99,102,241,0.12),transparent_50%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}
              >
                <feature.icon className="h-5 w-5 text-white" />
              </div>

              <h3 className="text-[15px] font-semibold text-white">
                {feature.title}
              </h3>

              <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
                {feature.description}
              </p>

              <div className="mt-4 min-h-[36px]">
                <AnimatePresence>
                  {hovered === feature.title && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 6,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: 4,
                      }}
                      transition={{
                        duration: 0.25,
                      }}
                      className="rounded-lg border border-cyan-100/[0.10] bg-white/[0.045] px-2.5 py-2"
                    >
                      <MiniDemo demo={feature.demo} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </motion.div>
        {/* Interactive study moments pair tactile cards with a transparent progress trace. */}
        <div className="mt-20 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">Choose your mode</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Turn a study moment into momentum.</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-400">Tap, click, or drag a card to reveal a focused way to use EduForge today.</p>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <FlipCard label="Flip active recall card" front={<ModeCard icon={<Brain className="h-5 w-5 text-cyan-200" />} label="Active recall" title="Why does spaced repetition work?" />} back={<ModeCard icon={<Layers className="h-5 w-5 text-amber-200" />} label="The answer" title="Revisit near the edge of forgetting to make retrieval stick." back />} />
              <FlipCard label="Flip focus sprint card" front={<ModeCard icon={<Calendar className="h-5 w-5 text-emerald-200" />} label="Focus sprint" title="25 minutes · Quantum basics" />} back={<ModeCard icon={<Trophy className="h-5 w-5 text-emerald-200" />} label="Make it count" title="One clear target, one short sprint, one tiny win." back />} />
              <FlipCard label="Flip AI tutor card" front={<ModeCard icon={<HelpCircle className="h-5 w-5 text-violet-200" />} label="Ask the tutor" title="Explain this like I’m five." />} back={<ModeCard icon={<span className="text-lg text-violet-200">✦</span>} label="Go deeper" title="Ask for an analogy, a quiz, or a counterexample." back />} />
            </div>
          </div>
          <ThoughtLine />
        </div>
      </div>
    </section>
  );
}

function ModeCard({ icon, label, title, back = false }: { icon: ReactNode; label: string; title: string; back?: boolean }) { const surface = back ? "border-amber-300/25 bg-gradient-to-br from-amber-300/15 via-[#201738]" : "border-cyan-300/20 bg-gradient-to-br from-cyan-400/15 via-[#092438]"; return <div className={`flex h-full min-h-[188px] flex-col justify-between rounded-2xl border ${surface} to-[#071522] p-5`}><div className="flex items-center justify-between">{icon}<span className="text-[10px] font-semibold uppercase tracking-widest text-slate-300/70">{label}</span></div><p className={`text-sm leading-relaxed ${back ? "text-slate-200" : "text-white"}`}>{title}</p></div>; }