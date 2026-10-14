"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ease } from "@/lib/motion";

export interface XpPoint {
  label: string;
  xp: number;
  total: number;
}

const W = 900;
const H = 240;
const PAD_Y = 16;

export default function XpAreaChart({ points }: { points: XpPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const maxTotal = Math.max(...points.map((p) => p.total), 1);
  const denom = Math.max(points.length - 1, 1);

  const coords = points.map((p, i) => ({
    x: (i / denom) * W,
    y: H - PAD_Y - (p.total / maxTotal) * (H - PAD_Y * 2),
  }));

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;

  const active = hover !== null ? points[hover] : null;
  const activeCoord = hover !== null ? coords[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-52 w-full"
        role="img"
        aria-label="Cumulative XP over time"
      >
        <defs>
          <linearGradient id="xp-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="xp-line-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>

        <motion.path
          d={areaPath}
          fill="url(#xp-area-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease }}
        />
        <motion.path
          d={linePath}
          fill="none"
          stroke="url(#xp-line-stroke)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease }}
        />
      </svg>

      {active && activeCoord && (
        <>
          <span
            className="pointer-events-none absolute z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)]"
            style={{
              left: `${(activeCoord.x / W) * 100}%`,
              top: `${(activeCoord.y / H) * 100}%`,
            }}
          />
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-white/10 bg-[#0c1224] px-2.5 py-1.5 text-[11px] text-slate-200 shadow-lg"
            style={{
              left: `${(activeCoord.x / W) * 100}%`,
              top: `calc(${(activeCoord.y / H) * 100}% - 12px)`,
            }}
          >
            <span className="font-medium text-white">{active.label}</span>
            {" · "}
            +{active.xp} XP · total {active.total.toLocaleString()}
          </div>
        </>
      )}

      <div className="absolute inset-0 flex">
        {points.map((p, i) => (
          <div
            key={i}
            className="h-full flex-1"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            aria-hidden
          />
        ))}
      </div>

      <div className="mt-1 flex justify-between text-[11px] text-slate-500">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}
