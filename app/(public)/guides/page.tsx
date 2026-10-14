import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/public/PageHero";
import BlogExplorer from "@/components/public/BlogExplorer";
import { guides, guideCategories } from "./guide-data";

export const metadata: Metadata = {
  title: "Guides — EduForge AI",
  description:
    "Step-by-step guides for scholarship applications, spaced repetition, AI tutoring, quiz revision and study planning.",
};

export default function GuidesPage() {
  return (
    <>
      <PageHero
        eyebrow="Guides"
        title="Step-by-step"
        titleAccent="when you need the how"
        description="Practical walkthroughs for the things students actually get stuck on — from writing a scholarship essay that gets read, to building a revision system that survives a full semester."
      >
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/30 hover:bg-white/[0.08]"
        >
          Prefer long-form reading? See the blog
        </Link>
      </PageHero>

      <div className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <BlogExplorer
          posts={guides}
          categories={guideCategories}
          basePath="/guides"
          searchPlaceholder="Search guides..."
          emptyMessage="No guides match your search. Try a different keyword or category."
        />
      </div>
    </>
  );
}
