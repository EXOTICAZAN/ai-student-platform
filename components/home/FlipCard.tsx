"use client";

import { ReactNode, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  className?: string;
  label?: string;
}

/** A keyboard-accessible, pointer-friendly 3D card for compact learning moments. */
export default function FlipCard({ front, back, className = "", label = "Flip learning card" }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const reduced = useReducedMotion();
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);

  const toggle = () => {
    if (!dragged.current) setFlipped((value) => !value);
    dragged.current = false;
  };

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={flipped}
      onClick={toggle}
      onPointerDown={(event) => {
        pointerStart.current = { x: event.clientX, y: event.clientY };
        dragged.current = false;
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!pointerStart.current) return;
        const distance = Math.hypot(event.clientX - pointerStart.current.x, event.clientY - pointerStart.current.y);
        if (distance > 8) dragged.current = true;
      }}
      onPointerUp={() => {
        pointerStart.current = null;
      }}
      className={`group relative block min-h-[188px] w-full cursor-pointer appearance-none border-0 bg-transparent p-0 text-left [perspective:1100px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 focus-visible:ring-offset-4 focus-visible:ring-offset-[#020b14] ${className}`}
    >
      <motion.span
        className="absolute inset-0 block [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 170, damping: 20 }}
      >
        <span className="absolute inset-0 block [backface-visibility:hidden]">{front}</span>
        <span className="absolute inset-0 block [backface-visibility:hidden] [transform:rotateY(180deg)]">{back}</span>
      </motion.span>
      <span className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-medium text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        {flipped ? "Tap to reset" : "Tap to reveal"}
      </span>
    </button>
  );
}
