export const SITE_NAME = "EduForge AI";

// Set NEXT_PUBLIC_SITE_URL in production so sitemaps, robots.txt and
// Open Graph tags resolve to absolute URLs instead of localhost.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
