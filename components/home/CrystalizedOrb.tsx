"use client";

import { motion, MotionValue, useTransform } from "framer-motion";

const dust = [
  [18, 32, 1.8, 0], [28, 18, 1.1, 1], [41, 10, 1.5, 2], [58, 12, 1, 3], [73, 23, 1.6, 4], [84, 38, 1.2, 5],
  [88, 55, 1.8, 6], [78, 72, 1, 7], [62, 84, 1.4, 8], [43, 87, 1.1, 9], [25, 75, 1.7, 10], [13, 56, 1, 11],
  [34, 30, 1, 12], [68, 34, 1.2, 13], [74, 62, 1, 14], [30, 60, 1.3, 15], [53, 24, .8, 16], [52, 76, .9, 17],
] as const;

function DustParticle({ x, y, size, delay, mouseX, mouseY, reduced }: { x: number; y: number; size: number; delay: number; mouseX: MotionValue<number>; mouseY: MotionValue<number>; reduced: boolean | null }) {
  const moveX = useTransform(mouseX, (value) => value * (x - 50) * 0.5);
  const moveY = useTransform(mouseY, (value) => value * (y - 50) * 0.5);
  return <motion.span className="absolute rounded-full bg-cyan-100 shadow-[0_0_12px_3px_rgba(86,231,255,.9)]" style={{ left: `${x}%`, top: `${y}%`, width: `${size * 3}px`, height: `${size * 3}px`, x: reduced ? 0 : moveX, y: reduced ? 0 : moveY }} animate={reduced ? { opacity: 0.65 } : { opacity: [0.3, 1, 0.4], scale: [0.8, 1.35, 0.8] }} transition={reduced ? { duration: 0 } : { duration: 2.4 + (delay % 4) * 0.25, delay: delay * 0.12, repeat: Infinity, ease: "easeInOut" }} />;
}

export default function CrystalizedOrb({ mouseX, mouseY, reduced }: { mouseX: MotionValue<number>; mouseY: MotionValue<number>; reduced: boolean | null }) {
  const rimRotate = useTransform(mouseX, [-0.5, 0.5], [-8, 8]);
  return <div className="pointer-events-none absolute inset-[15%] z-0" aria-label="Crystal learning orb with reactive energy rim">
    <motion.div className="absolute -inset-[5%] rounded-full opacity-90" style={{ rotate: reduced ? 0 : rimRotate, background: "conic-gradient(from 20deg, transparent 0deg, rgba(86,231,255,.85) 35deg, transparent 62deg, rgba(255,196,92,.95) 115deg, transparent 145deg, rgba(86,231,255,.8) 220deg, transparent 285deg)" }} animate={reduced ? undefined : { rotate: [0, 360] }} transition={reduced ? undefined : { duration: 14, repeat: Infinity, ease: "linear" }} />
    <div className="absolute inset-[2px] rounded-full bg-[#071522]" />
    <div className="absolute inset-[5%] rounded-full border border-cyan-100/25 bg-[radial-gradient(circle_at_32%_22%,rgba(237,255,255,.96),rgba(94,232,239,.62)_9%,rgba(19,100,125,.7)_32%,rgba(5,19,35,.98)_73%)] shadow-[inset_-30px_-25px_55px_rgba(0,0,0,.72),inset_12px_10px_24px_rgba(255,255,255,.18),0_0_65px_rgba(52,210,238,.3)]" />
    <div className="absolute inset-[14%] rounded-full border border-dashed border-cyan-100/25" />
    <div className="absolute inset-[22%] rounded-full border border-amber-200/20 [transform:rotateX(68deg)_rotateZ(-24deg)]" />
    <div className="absolute inset-[28%] rounded-full border border-cyan-100/20 [transform:rotateY(68deg)_rotateZ(18deg)]" />
    {[
      "left-[41%] top-[17%] h-[42%] rotate-[21deg]", "left-[53%] top-[20%] h-[38%] -rotate-[34deg]", "left-[30%] top-[43%] h-[37%] -rotate-[12deg]", "left-[62%] top-[45%] h-[31%] rotate-[14deg]", "left-[48%] top-[55%] h-[29%] rotate-[48deg]",
    ].map((position, index) => <span key={index} className={`absolute w-px origin-top bg-gradient-to-b from-white/70 via-cyan-200/60 to-transparent shadow-[0_0_8px_#56e7ff] ${position}`} />)}
    {dust.map(([x, y, size, delay]) => <DustParticle key={`${x}-${y}`} x={x} y={y} size={size} delay={delay} mouseX={mouseX} mouseY={mouseY} reduced={reduced} />)}
  </div>;
}
