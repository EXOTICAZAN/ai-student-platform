"use client";

import { motion } from "framer-motion";
import { toast } from "sonner";
import { fadeUp, stagger, ease } from "@/lib/motion";

export interface BrandColor {
  name: string;
  hex: string;
  usage: string;
}

export default function ColorSwatches({ colors }: { colors: BrandColor[] }) {
  const copy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      toast.success(`Copied ${hex}`);
    } catch {
      toast.error("Couldn't access the clipboard — copy the hex manually.");
    }
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {colors.map((color) => (
        <motion.button
          key={color.hex + color.name}
          variants={fadeUp}
          transition={{ duration: 0.5, ease }}
          onClick={() => copy(color.hex)}
          className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 text-left transition-colors hover:border-indigo-500/40"
        >
          <span
            className="block h-20 w-full rounded-xl border border-white/10 transition-transform duration-300 group-hover:scale-[1.02]"
            style={{ background: color.hex }}
          />
          <span className="mt-4 block text-sm font-semibold text-white">{color.name}</span>
          <span className="mt-0.5 block font-mono text-xs text-indigo-300">{color.hex}</span>
          <span className="mt-2 block text-xs leading-relaxed text-slate-500">{color.usage}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}
