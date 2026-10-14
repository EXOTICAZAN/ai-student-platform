"use client";

import Link from "next/link";
import { Sparkles, Globe } from "lucide-react";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "AI Tutor", href: "/#ai-tutor" },
      { label: "Scholarships", href: "/#scholarships" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Guides", href: "/guides" },
      { label: "Help Center", href: "/help" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/#about" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
      { label: "Press", href: "/press" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Security", href: "/security" },
    ],
  },
];

const socials = [
  { icon: Globe, href: "/", label: "Website" },
];
export default function Footer() {
  return (
    <footer className="relative border-t border-white/8 bg-[#02070d] pt-16 pb-10">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" />
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-700">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">
                EduForge<span className="text-cyan-300">AI</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              The AI learning platform that helps students master any subject faster and smarter.
            </p>
            <div className="mt-6 flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-white/20 hover:text-white"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-white">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Updates: no newsletter provider is configured yet, so do not present a
            form that silently discards an email address. */}
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/8 pt-10 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-white">Stay in the loop</p>
            <p className="mt-1 text-sm text-slate-400">
              Updates are announced in the product and on the blog.
            </p>
          </div>
          <Link
            href="/blog"
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-white/20 hover:text-white"
          >
            Read the blog
          </Link>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-8 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} EduForge AI. All rights reserved.
          </p>
          <p className="text-xs text-slate-600">Built for students who refuse to settle.</p>
        </div>
      </div>
    </footer>
  );
}