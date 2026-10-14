import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/public/PageHero";
import BlogExplorer from "@/components/public/BlogExplorer";
import { posts, postCategories } from "./posts";

export const metadata: Metadata = {
  title: "Blog — EduForge AI",
  description:
    "Practical articles on AI-assisted studying, spaced repetition, active recall, focus, and scholarship applications.",
};

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Ideas for studying"
        titleAccent="that actually work"
        description="Evidence-based study techniques, honest takes on AI-assisted learning, and scholarship strategy — written by the team building EduForge AI."
      >
        <Link
          href="/guides"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/30 hover:bg-white/[0.08]"
        >
          Prefer step-by-step? Browse the guides
        </Link>
      </PageHero>
      <div className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <BlogExplorer posts={posts} categories={postCategories} />
      </div>
    </>
  );
}
