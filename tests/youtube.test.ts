import { describe, expect, it, vi } from "vitest";
import { buildYouTubeSearchQuery, extractYouTubeVideoId, resolveCourseVideos, youtubeWatchUrl } from "@/lib/courses/youtube";
import type { GeneratedCourse } from "@/lib/courses/types";

describe("YouTube course helpers", () => {
  it("builds a bounded, sanitized search query", () => {
    const query = buildYouTubeSearchQuery("TypeScript!!!", "Module 1", "Generics & types".repeat(20));
    expect(query.length).toBeLessThanOrEqual(120);
    expect(query).not.toContain("!");
  });

  it("accepts only valid YouTube watch ids", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=abc_123-" )).toBe("abc_123-");
    expect(extractYouTubeVideoId("https://www.youtube.com/results?search_query=typescript")).toBeNull();
    expect(extractYouTubeVideoId("https://example.com/watch?v=abc_123-")).toBeNull();
    expect(youtubeWatchUrl("abc_123-")).toBe("https://www.youtube.com/watch?v=abc_123-");
  });

  it("uses validated API ids and falls back without leaking failures", async () => {
    const course: GeneratedCourse = { title: "T", description: "D", skill_level: "beginner", estimated_duration: "1 week", modules: [{ title: "M", description: "D", videos: [{ title: "Lesson", url: "https://www.youtube.com/results?search_query=lesson" }] }] };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ items: [{ id: { kind: "youtube#video", videoId: "video_1" } }] }), { status: 200 }));
    const resolved = await resolveCourseVideos(course, "topic", { apiKey: "server-key", fetcher });
    expect(resolved.modules[0].videos[0].url).toBe("https://www.youtube.com/watch?v=video_1");
    expect(fetcher).toHaveBeenCalledOnce();

    fetcher.mockResolvedValue(new Response(JSON.stringify({ items: [{ id: { kind: "youtube#channel", videoId: "bad" } }] }), { status: 200 }));
    const fallback = await resolveCourseVideos(course, "topic", { apiKey: "server-key", fetcher });
    expect(fallback.modules[0].videos[0].url).toContain("/results?search_query=");
  });
});
