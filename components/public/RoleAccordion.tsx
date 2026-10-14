"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MapPin, Clock3, Users, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

export interface Role {
  title: string;
  team: string;
  location: string;
  type: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
}

export default function RoleAccordion({ roles }: { roles: Role[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {roles.map((role, i) => {
        const isOpen = openIndex === i;
        const subject = encodeURIComponent(`Application: ${role.title} at EduForge AI`);
        const body = encodeURIComponent(
          `Hi EduForge AI team,\n\nI'd like to apply for the ${role.title} role.\n\nName:\nRelevant experience:\nLinks (portfolio / GitHub / LinkedIn):\n\nThank you!`
        );
        return (
          <div
            key={role.title}
            className={cn(
              "rounded-2xl border bg-white/[0.03] p-5 transition-colors",
              isOpen ? "border-indigo-500/40" : "border-white/[0.08]"
            )}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-start justify-between gap-4 text-left"
            >
              <div>
                <h3 className="text-lg font-semibold text-white">{role.title}</h3>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {role.team}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {role.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    {role.type}
                  </span>
                </div>
              </div>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.25, ease }}
                className="mt-1 shrink-0 text-slate-500"
              >
                <ChevronDown className="h-4 w-4" />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease }}
                >
                  <div className="mt-5 space-y-5 border-t border-white/[0.06] pt-5">
                    <p className="text-sm leading-relaxed text-slate-400">{role.summary}</p>
                    <div>
                      <p className="text-sm font-semibold text-white">What you&apos;ll do</p>
                      <ul className="mt-2 ml-5 list-disc space-y-1.5 text-sm text-slate-400">
                        {role.responsibilities.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">What we look for</p>
                      <ul className="mt-2 ml-5 list-disc space-y-1.5 text-sm text-slate-400">
                        {role.requirements.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>
                    <a
                      href={`mailto:azanalikhadim02@gmail.com?subject=${subject}&body=${body}`}
                      className="inline-flex items-center gap-2 rounded-full btn-gradient px-6 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02]"
                    >
                      <Mail className="h-4 w-4" />
                      Apply via email
                    </a>
                    <p className="text-xs text-slate-500">
                      We don&apos;t run an application portal yet — this button opens your
                      email app with a prefilled application to azanalikhadim02@gmail.com.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
