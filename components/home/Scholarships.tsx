"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, MapPin, Calendar, Percent, ArrowRight } from "lucide-react";
import { ease } from "@/lib/motion";

const countries = [
  {
    id: "us",
    name: "United States",
    flag: "🇺🇸",
    items: [
      { title: "Google AI Scholarship", amount: "$10,000", deadline: "Mar 2026", rate: "12%" },
      { title: "NSF Graduate Fellowship", amount: "$37,000", deadline: "Oct 2026", rate: "15%" },
    ],
  },
  {
    id: "uk",
    name: "United Kingdom",
    flag: "🇬🇧",
    items: [
      { title: "DeepMind Scholarship", amount: "Full tuition", deadline: "Jan 2026", rate: "8%" },
      { title: "Chevening AI Track", amount: "Full funding", deadline: "Nov 2026", rate: "10%" },
    ],
  },
  {
    id: "de",
    name: "Germany",
    flag: "🇩🇪",
    items: [
      { title: "DAAD AI Excellence", amount: "€1,200/mo", deadline: "Apr 2026", rate: "18%" },
    ],
  },
  {
    id: "jp",
    name: "Japan",
    flag: "🇯🇵",
    items: [
      { title: "MEXT AI Program", amount: "Full + stipend", deadline: "May 2026", rate: "9%" },
    ],
  },
  {
    id: "ca",
    name: "Canada",
    flag: "🇨🇦",
    items: [
      { title: "CIFAR AI Scholarship", amount: "CAD $25,000", deadline: "Feb 2026", rate: "14%" },
    ],
  },
  {
    id: "au",
    name: "Australia",
    flag: "🇦🇺",
    items: [
      { title: "Australia Awards AI", amount: "Full funding", deadline: "Jun 2026", rate: "11%" },
    ],
  },
];

export default function Scholarships() {
  const [active, setActive] = useState(countries[0].id);
  const current = countries.find((c) => c.id === active)!;

  return (
    <section id="scholarships" className="relative scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Scholarships
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Funding opportunities
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {" "}worldwide
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-400">
            Select a country to explore matched scholarships.
          </p>
        </motion.div>

        {/* Country selector */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2.5">
          {countries.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all duration-300 ${
                active === c.id
                  ? "border-cyan-400/40 bg-cyan-400/15 text-white shadow-[0_0_24px_rgba(86,231,255,0.2)]"
                  : "border-cyan-100/[0.10] bg-[#071b2a]/65 text-slate-400 hover:border-white/20 hover:text-white"
              }`}
            >
              <span className="text-base">{c.flag}</span>
              <span className="hidden sm:inline">{c.name}</span>
            </button>
          ))}
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2"
          >
            {current.items.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i }}
                className="group rounded-2xl border border-cyan-100/[0.10] bg-[#071b2a]/65 p-5 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
                    <Trophy className="h-5 w-5 text-amber-400" />
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                    {item.amount}
                  </span>
                </div>
                <h3 className="mt-3 text-[15px] font-semibold text-white">{item.title}</h3>
                <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {item.deadline}
                  </span>
                  <span className="flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5" />
                    {item.rate} accept
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {current.name}
                  </span>
                </div>
                <button className="mt-4 flex items-center gap-1.5 text-[13px] font-medium text-cyan-300 transition-colors group-hover:text-cyan-200">
                  View details
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
