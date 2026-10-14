import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Clock, User } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import AnimatedSection from "@/components/public/AnimatedSection";
import ArticleBody from "@/components/public/ArticleBody";
import { posts, getPost } from "../posts";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Post not found — EduForge AI" };
  return {
    title: `${post.title} — EduForge AI Blog`,
    description: post.excerpt,
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = posts
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .slice(0, 2);

  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <PageHero
        eyebrow={post.category}
        title={post.title}
        className="pb-8"
      >
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            {post.author}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {formattedDate}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {post.readingTime} min read
          </span>
        </div>
      </PageHero>

      <div className="mx-auto max-w-3xl px-6 pb-24 lg:px-8">
        <AnimatedSection>
          <p className="rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.07] px-5 py-4 text-[15px] leading-relaxed text-slate-300">
            {post.excerpt}
          </p>
        </AnimatedSection>
        <div className="mt-12">
          <ArticleBody sections={post.sections} />
        </div>

        <div className="mt-14 border-t border-white/[0.08] pt-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            All articles
          </Link>
        </div>

        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              More in {post.category}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
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
