import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Compass, LifeBuoy, Mail } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import AnimatedSection from "@/components/public/AnimatedSection";
import FaqExplorer from "@/components/public/FaqExplorer";
import { faqs, faqCategories } from "./faqs";

export const metadata: Metadata = {
  title: "Help Center — EduForge AI",
  description:
    "Answers to common questions about the AI tutor, notes, flashcards, quizzes, scholarship matching and your account data.",
};

const RELATED = [
  {
    href: "/guides",
    icon: Compass,
    title: "Browse the guides",
    description: "Step-by-step walkthroughs for scholarships, spaced repetition and planning.",
  },
  {
    href: "/blog",
    icon: BookOpen,
    title: "Read the blog",
    description: "Longer pieces on study science and how to get more from AI-assisted revision.",
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHero
        eyebrow="Help Center"
        title="Answers,"
        titleAccent="before you have to ask"
        description="Everything about using EduForge AI — the tutor, notes, flashcards, quizzes, scholarship matching and your data. Search below, or jump to a category."
      />

      <div className="mx-auto max-w-4xl px-6 pb-16 lg:px-8">
        <FaqExplorer faqs={faqs} categories={faqCategories} />
      </div>

      <div className="mx-auto max-w-4xl px-6 pb-24 lg:px-8">
        <AnimatedSection>
          <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.07] p-6 text-center sm:p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 ring-1 ring-indigo-500/30">
              <LifeBuoy className="h-5 w-5 text-indigo-300" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-white">
              Still stuck?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
              Tell us what you were trying to do and what happened instead. The more
              specific you are, the faster we can help.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/contact"
                className="btn-gradient inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all hover:brightness-110"
              >
                <Mail className="h-4 w-4" />
                Contact us
              </Link>
              <Link
                href="/security"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-white/30 hover:text-white"
              >
                Reporting a security issue?
              </Link>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1} className="mt-8 grid gap-4 sm:grid-cols-2">
          {RELATED.map(({ href, icon: Icon, title, description }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition-colors hover:border-indigo-500/40 hover:bg-white/[0.05]"
            >
              <Icon className="h-5 w-5 text-indigo-400 transition-transform group-hover:scale-110" />
              <p className="mt-3 font-semibold text-white group-hover:text-indigo-300">
                {title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                {description}
              </p>
            </Link>
          ))}
        </AnimatedSection>
      </div>
    </>
  );
}
