"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { Menu, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#scholarships", label: "Scholarships" },
  { href: "/#ai-tutor", label: "AI Tutor" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#about", label: "About" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState("");
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Scroll progress */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-cyan-400 via-cyan-300 to-amber-300"
      />

      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-[#050816]/75 backdrop-blur-2xl border-b border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
            : "bg-transparent"
        )}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div
            className={cn(
              "flex items-center justify-between transition-all duration-500",
              scrolled ? "h-14 lg:h-16" : "h-16 lg:h-20"
            )}
          >
            {/* Logo */}
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-700 shadow-lg shadow-cyan-500/35 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-cyan-500/50">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-white">
                EduForge<span className="text-cyan-300">AI</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-0.5 lg:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setActive(link.href)}
                  className={cn(
                    "relative px-4 py-2 text-[13px] font-medium transition-colors duration-300",
                    active === link.href ? "text-white" : "text-slate-400 hover:text-white"
                  )}
                >
                  {link.label}
                  {active === link.href && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute bottom-0.5 left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-cyan-300 to-amber-300"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden items-center gap-3 lg:flex">
              <Link
                href="/login"
                className="px-4 py-2 text-[13px] font-medium text-slate-300 transition-colors hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/50"
              >
                <span className="relative z-10">Get Started</span>
                <span className="absolute inset-0 bg-gradient-to-r from-amber-400 to-cyan-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </Link>
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-white/5 lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease }}
              className="overflow-hidden border-t border-white/[0.07] bg-[#050816]/95 backdrop-blur-2xl lg:hidden"
            >
              <div className="space-y-1 px-6 py-5">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-xl px-4 py-3 text-[15px] font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <div className="mt-4 flex flex-col gap-2.5 border-t border-white/[0.07] pt-4">
                  <Link
                    href="/login"
                    className="rounded-xl px-4 py-3 text-center text-sm font-medium text-slate-300 hover:bg-white/5"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600 px-4 py-3 text-center text-sm font-semibold text-white"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}