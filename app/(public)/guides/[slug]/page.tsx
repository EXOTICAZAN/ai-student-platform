import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import AnimatedSection from "@/components/public/AnimatedSection";
import { guides, getGuide } from "../guide-data";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) return { title: "Guide not found — EduForge AI" };

  return {
    title: `${guide.title} — EduForge AI Guides`,
    description: guide.excerpt,
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) notFound();

  const related = guides
    .filter((g) => g.slug !== guide.slug && g.category === guide.category)
    .slice(0, 2);

  const formattedDate = new Date(guide.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <PageHero eyebrow={guide.category} title={guide.title} className="pb-8">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {formattedDate}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {guide.readingTime} min read
          </span>
          <span className="inline-flex items-center gap-1.5">
            {guide.steps.length} steps
          </span>
        </div>
      </PageHero>

      <div className="mx-auto max-w-3xl px-6 pb-24 lg:px-8">
        <AnimatedSection>
          <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.07] px-5 py-4">
            {guide.intro.map((paragraph, i) => (
              <p
                key={i}
                className="text-[15px] leading-relaxed text-slate-300 [&+&]:mt-3"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </AnimatedSection>

        <ol className="mt-12 space-y-10">
          {guide.steps.map((step, i) => (
            <li key={step.title}>
              <AnimatedSection delay={Math.min(i * 0.05, 0.2)}>
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-indigo-500/40 bg-indigo-500/10 text-sm font-semibold text-indigo-300">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-semibold tracking-tight text-white">
                      {step.title}
                    </h2>
                    <div className="mt-3 space-y-3">
                      {step.paragraphs.map((paragraph, j) => (
                        <p key={j} className="leading-relaxed text-slate-400">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </li>
          ))}
        </ol>

        {guide.takeaways.length > 0 && (
          <AnimatedSection className="mt-14">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Key takeaways
              </h2>
              <ul className="mt-4 space-y-3">
                {guide.takeaways.map((takeaway) => (
                  <li key={takeaway} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span className="text-sm leading-relaxed text-slate-300">
                      {takeaway}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedSection>
        )}

        <div className="mt-14 border-t border-white/[0.08] pt-8">
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            All guides
          </Link>
        </div>

        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              More in {guide.category}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/guides/${r.slug}`}
                  className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition-colors hover:border-indigo-500/40"
                >
                  <p className="font-semibold leading-snug text-white group-hover:text-indigo-300">
                    {r.title}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500">
                    {r.readingTime} min read
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
