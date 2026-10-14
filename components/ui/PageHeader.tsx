"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

/** Standard heading block for every dashboard page. */
export default function PageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className={cn("flex flex-wrap items-start justify-between gap-4", className)}
    >
      <motion.div variants={fadeUp} className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <Icon className="h-5 w-5 shrink-0 text-indigo-400" />
          <h1 className="truncate text-2xl font-bold text-white">{title}</h1>
        </div>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </motion.div>

      {actions && (
        <motion.div
          variants={fadeUp}
          className="flex flex-wrap items-center gap-2"
        >
          {actions}
        </motion.div>
      )}
    </motion.div>
  );
}
