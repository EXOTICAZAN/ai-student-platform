"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function AuthBackground() {
  const reduced = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050816]">
      {/* Base aurora */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(79,70,229,0.22),transparent),radial-gradient(ellipse_60%_40%_at_85%_50%,rgba(168,85,247,0.14),transparent),radial-gradient(ellipse_50%_35%_at_10%_80%,rgba(59,130,246,0.1),transparent)]" />

      {!reduced && (
        <>
          <motion.div
            animate={{ x: [0, 70, -40, 0], y: [0, -50, 30, 0], scale: [1, 1.12, 0.94, 1] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-36 top-[18%] h-[480px] w-[480px] rounded-full bg-indigo-600/25 blur-[130px]"
          />
          <motion.div
            animate={{ x: [0, -60, 45, 0], y: [0, 40, -25, 0], scale: [1, 0.9, 1.1, 1] }}
            transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-40 top-[35%] h-[440px] w-[440px] rounded-full bg-purple-600/18 blur-[120px]"
          />
          <motion.div
            animate={{ x: [0, 35, -55, 0], y: [0, 55, -20, 0] }}
            transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-5%] left-[30%] h-[360px] w-[360px] rounded-full bg-blue-500/12 blur-[100px]"
          />
        </>
      )}

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 15%, transparent 70%)",
        }}
      />

      {/* Particles */}
      {!reduced &&
        Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: i % 5 === 0 ? 2 : 1,
              height: i % 5 === 0 ? 2 : 1,
              left: `${(i * 17 + 9) % 100}%`,
              top: `${(i * 23 + 11) % 100}%`,
              opacity: 0.2 + (i % 4) * 0.08,
            }}
            animate={{ y: [0, -20 - (i % 7), 0], opacity: [0.15, 0.5, 0.15] }}
            transition={{
              duration: 4.5 + (i % 5),
              repeat: Infinity,
              delay: i * 0.22,
              ease: "easeInOut",
            }}
          />
        ))}
    </div>
  );
}
