"use client";

import { motion, useReducedMotion } from "framer-motion";

const particles = Array.from({ length: 30 }, (_, i) => ({
  left: `${(i * 29 + 7) % 100}%`,
  top: `${(i * 47 + 11) % 100}%`,
  size: i % 7 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
  delay: i * 0.18,
}));

export default function Background() {
  const reduced = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#020b14]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_72%_58%_at_50%_-12%,rgba(19,126,157,.32),transparent_68%),radial-gradient(ellipse_40%_50%_at_100%_35%,rgba(255,139,105,.12),transparent_72%),radial-gradient(ellipse_50%_45%_at_0%_78%,rgba(0,198,222,.11),transparent_70%)]" />

      {!reduced && (
        <>
          <motion.div
            animate={{ x: [0, 70, -35, 0], y: [0, -50, 30, 0], scale: [1, 1.12, 0.94, 1] }}
            transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-48 top-[14%] h-[540px] w-[540px] rounded-full bg-cyan-500/12 blur-[130px]"
          />
          <motion.div
            animate={{ x: [0, -60, 34, 0], y: [0, 42, -24, 0], scale: [1, 0.9, 1.08, 1] }}
            transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-48 top-[30%] h-[520px] w-[520px] rounded-full bg-amber-500/10 blur-[125px]"
          />
        </>
      )}

      <div className="absolute left-1/2 top-[13%] h-[42vh] w-[42vh] -translate-x-1/2 rounded-full border border-cyan-200/[.06] shadow-[0_0_140px_rgba(0,199,222,.08)]" />
      <div
        className="absolute inset-x-0 bottom-0 h-[58%] opacity-30 [transform:perspective(600px)_rotateX(62deg)_scale(1.5)_translateY(20%)]"
        style={{
          backgroundImage: "linear-gradient(rgba(86,231,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(86,231,255,.12) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "linear-gradient(to bottom, transparent, black 35%, transparent)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)",
          backgroundSize: "88px 88px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 35%, black 10%, transparent 76%)",
        }}
      />

      {particles.map((particle, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-cyan-100 shadow-[0_0_12px_rgba(99,239,255,.8)]"
          style={{ left: particle.left, top: particle.top, width: particle.size, height: particle.size, opacity: 0.18 + (i % 5) * 0.08 }}
          animate={reduced ? undefined : { opacity: [0.12, 0.65, 0.12], y: [0, -18, 0], scale: [1, 1.5, 1] }}
          transition={{ duration: 5 + (i % 5), repeat: Infinity, delay: particle.delay, ease: "easeInOut" }}
        />
      ))}

      <div className="absolute inset-0 opacity-[0.025] mix-blend-screen" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
    </div>
  );
}
