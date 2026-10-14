import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { posts } from "@/app/(public)/blog/posts";
import { guides } from "@/app/(public)/guides/guide-data";

const MARKETING: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/blog", priority: 0.8 },
  { path: "/guides", priority: 0.8 },
  { path: "/help", priority: 0.6 },
  { path: "/careers", priority: 0.5 },
  { path: "/contact", priority: 0.5 },
  { path: "/press", priority: 0.4 },
  { path: "/privacy", priority: 0.2 },
  { path: "/terms", priority: 0.2 },
  { path: "/security", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = MARKETING.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority,
  }));

  const articleEntries = [
    ...posts.map((post) => ({ url: `${SITE_URL}/blog/${post.slug}`, date: post.date })),
    ...guides.map((guide) => ({ url: `${SITE_URL}/guides/${guide.slug}`, date: guide.date })),
  ].map(({ url, date }) => ({
    url,
    lastModified: new Date(date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...articleEntries];
}
