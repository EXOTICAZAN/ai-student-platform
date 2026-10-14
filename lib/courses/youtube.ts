import type { GeneratedCourse } from "./types";

const API_ENDPOINT = "https://www.googleapis.com/youtube/v3/search";
export const MAX_YOUTUBE_RESOLVES = 24;
const MAX_QUERY_LENGTH = 120;

type YouTubeSearchResponse = {
  items?: Array<{ id?: { kind?: unknown; videoId?: unknown } }>;
};

export function buildYouTubeSearchQuery(topic: string, moduleTitle: string, lessonTitle: string) {
  return [lessonTitle, moduleTitle, topic]
    .map((part) => part.replace(/[^\p{L}\p{N}\s.'+#-]/gu, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" ")
    .slice(0, MAX_QUERY_LENGTH);
}

export function youtubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

export function extractYouTubeVideoId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (!["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) return null;
    if (url.pathname !== "/watch") return null;
    const id = url.searchParams.get("v");
    return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

async function searchYouTubeVideoId(query: string, apiKey: string, fetcher: typeof fetch): Promise<string | null> {
  const url = new URL(API_ENDPOINT);
  url.search = new URLSearchParams({ key: apiKey, part: "snippet", q: query, type: "video", maxResults: "1", safeSearch: "moderate", videoEmbeddable: "true", fields: "items(id(kind,videoId))" }).toString();
  const response = await fetcher(url, { headers: { Accept: "application/json" } });
  if (!response.ok) return null;
  const payload = await response.json() as YouTubeSearchResponse;
  const item = payload.items?.[0];
  if (item?.id?.kind !== "youtube#video" || typeof item.id.videoId !== "string" || !/^[A-Za-z0-9_-]{6,20}$/.test(item.id.videoId)) return null;
  return item.id.videoId;
}

/** Resolve generated lesson links on the server. Missing keys and API failures retain safe AI URLs. */
export async function resolveCourseVideos(course: GeneratedCourse, topic: string, options: { apiKey?: string; fetcher?: typeof fetch } = {}): Promise<GeneratedCourse> {
  const apiKey = options.apiKey?.trim();
  if (!apiKey) return course;
  const fetcher = options.fetcher ?? fetch;
  let requests = 0;
  const modules = [];
  for (const courseModule of course.modules) {
    const videos = [];
    for (const video of courseModule.videos) {
      if (requests >= MAX_YOUTUBE_RESOLVES) {
        videos.push(video);
        continue;
      }
      requests += 1;
      const query = buildYouTubeSearchQuery(topic, courseModule.title, video.title);
      try {
        const id = await searchYouTubeVideoId(query, apiKey, fetcher);
        videos.push(id ? { ...video, url: youtubeWatchUrl(id) } : video);
      } catch {
        videos.push(video);
      }
    }
    modules.push({ ...courseModule, videos });
  }
  return { ...course, modules };
}
