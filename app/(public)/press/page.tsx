import type { Metadata } from "next";
import { Copy, Mail, Palette, Quote, Type } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import AnimatedSection from "@/components/public/AnimatedSection";
import ColorSwatches, { type BrandColor } from "@/components/public/ColorSwatches";

export const metadata: Metadata = {
  title: "Press & Brand — EduForge AI",
  description:
    "Press information, boilerplate copy and brand assets for EduForge AI.",
};

const colors: BrandColor[] = [
  {
    name: "Background",
    hex: "#050816",
    usage: "The page canvas. Everything sits on this near-black navy.",
  },
  {
    name: "Primary — Indigo",
    hex: "#4F46E5",
    usage: "Buttons, links, active states and the leading edge of gradients.",
  },
  {
    name: "Primary glow",
    hex: "#818CF8",
    usage: "Lighter indigo for hover states, icons and gradient midpoints.",
  },
  {
    name: "Accent — Purple",
    hex: "#A855F7",
    usage: "Secondary accent. Pairs with indigo in gradients and highlights.",
  },
  {
    name: "Accent glow",
    hex: "#C084FC",
    usage: "Lighter purple for gradient endpoints and emphasis.",
  },
  {
    name: "Muted text",
    hex: "#94A3B8",
    usage: "Body copy and secondary labels on dark surfaces.",
  },
];

const BOILERPLATE_SHORT =
  "EduForge AI is a study companion that turns a student's own material into active revision. Upload a lecture PDF or paste your notes and it produces structured study notes, spaced-repetition flashcards and multiple-choice quizzes with explanations, alongside an AI tutor that answers questions grounded in your documents. A scholarship matcher evaluates structured eligibility rules against a student profile, and a planner turns a goal into a day-by-day schedule.";

const BOILERPLATE_LONG = `${BOILERPLATE_SHORT}

The product is built around a loop rather than a chatbot: material goes in, study material comes out, and measured performance feeds the next round. Retrieval over a student's own documents keeps answers tied to the course they are actually sitting, and every generated artefact is editable — the model is treated as a first draft, not an authority.

EduForge AI is an early-stage project. Billing is not enabled, there is no mobile app, and the team is small. Scholarship records carry an official source URL and a verification status because eligibility and deadlines change, and the product is explicit that AI output should be checked before it is relied on.`;

const FACTS = [
  { label: "Product", value: "AI study companion for students" },
  { label: "Stage", value: "Early-stage project" },
  { label: "Platform", value: "Web (responsive, no native app)" },
  { label: "Billing", value: "Not enabled — free during development" },
  { label: "Core features", value: "AI tutor, notes, flashcards, quizzes, planner, scholarship matching, analytics" },
  { label: "AI provider", value: "Groq" },
  { label: "Infrastructure", value: "Next.js, Supabase (Postgres + Storage)" },
];

export default function PressPage() {
  return (
    <>
      <PageHero
        eyebrow="Press & Brand"
        title="Everything you need"
        titleAccent="to write about us"
        description="Accurate descriptions, copy you can paste, and the real brand values. If you are writing about EduForge AI and something here is unclear, email us rather than guessing."
      />

      <div className="mx-auto max-w-4xl px-6 pb-24 lg:px-8">
        <AnimatedSection>
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <Quote className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Boilerplate
              </h2>
            </div>

            <p className="mt-4 text-xs font-medium uppercase tracking-wider text-slate-500">
              Short — one paragraph
            </p>
            <p className="mt-2 rounded-xl border border-white/[0.06] bg-black/20 p-4 text-sm leading-relaxed text-slate-300">
              {BOILERPLATE_SHORT}
            </p>

            <p className="mt-6 text-xs font-medium uppercase tracking-wider text-slate-500">
              Long — two to three paragraphs
            </p>
            <div className="mt-2 space-y-4 rounded-xl border border-white/[0.06] bg-black/20 p-4">
              {BOILERPLATE_LONG.split("\n\n").map((paragraph) => (
                <p key={paragraph.slice(0, 32)} className="text-sm leading-relaxed text-slate-300">
                  {paragraph}
                </p>
              ))}
            </div>

            <a
              href="mailto:azanalikhadim02@gmail.com?subject=Press%20inquiry%20%E2%80%94%20EduForge%20AI"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-300 transition-colors hover:text-white"
            >
              <Mail className="h-4 w-4" />
              Press inquiries: azanalikhadim02@gmail.com
            </a>
          </section>
        </AnimatedSection>

        <AnimatedSection delay={0.05} className="mt-10">
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <Type className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Fast facts
              </h2>
            </div>
            <dl className="mt-5 divide-y divide-white/[0.06]">
              {FACTS.map(({ label, value }) => (
                <div key={label} className="grid gap-1 py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="text-sm text-slate-500">{label}</dt>
                  <dd className="text-sm text-slate-200">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 rounded-xl border-l-4 border-amber-500 bg-amber-500/[0.08] px-4 py-3 text-sm leading-relaxed text-slate-300">
              Please do not attribute funding rounds, user counts, customer logos, awards or press
              coverage to EduForge AI. None of that exists, and we would rather correct the record
              than have it corrected for us.
            </p>
          </section>
        </AnimatedSection>

        <AnimatedSection delay={0.1} className="mt-10">
          <section>
            <div className="flex items-center gap-2.5">
              <Palette className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Brand colours
              </h2>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              These are the values the interface actually uses. Click any swatch to copy its hex.
            </p>
            <div className="mt-5">
              <ColorSwatches colors={colors} />
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection delay={0.15} className="mt-10">
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <Copy className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Name & logo usage
              </h2>
            </div>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-white">Do</p>
                <ul className="mt-2 ml-5 list-disc space-y-1.5 text-sm leading-relaxed text-slate-400">
                  <li>Write it as &ldquo;EduForge AI&rdquo; — two words, capital E, F and AI.</li>
                  <li>Place the mark on a dark background; it is designed for one.</li>
                  <li>Leave clear space around the mark equal to the height of the &ldquo;E&rdquo;.</li>
                  <li>Use indigo-to-purple gradients sparingly, as accents rather than fills.</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Don&apos;t</p>
                <ul className="mt-2 ml-5 list-disc space-y-1.5 text-sm leading-relaxed text-slate-400">
                  <li>Do not recolour the mark outside the palette above.</li>
                  <li>Do not add drop shadows, outlines or bevels.</li>
                  <li>Do not use it to imply endorsement, partnership or investment.</li>
                  <li>Do not use &ldquo;EduForge&rdquo; alone where it could be confused with another product.</li>
                </ul>
              </div>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-slate-400">
              There is no downloadable logo package yet. If you need vector assets at print
              resolution, email{" "}
              <a
                href="mailto:azanalikhadim02@gmail.com?subject=Brand%20assets%20request"
                className="font-medium text-indigo-300 underline transition-colors hover:text-white"
              >
                azanalikhadim02@gmail.com
              </a>{" "}
              and we will send them directly.
            </p>
          </section>
        </AnimatedSection>
      </div>
    </>
  );
}
