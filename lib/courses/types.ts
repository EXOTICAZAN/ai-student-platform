export const COURSE_SKILL_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type CourseSkillLevel = (typeof COURSE_SKILL_LEVELS)[number];

export interface CourseProfileInput {
  interests: string[];
  goal: string;
  skillLevel: CourseSkillLevel;
  weeklyTime: number;
  format: "video" | "reading" | "mixed";
}

export interface GeneratedCourse {
  title: string;
  description: string;
  skill_level: CourseSkillLevel;
  estimated_duration: string;
  modules: Array<{
    title: string;
    description: string;
    videos: Array<{ title: string; url: string; duration?: string }>;
  }>;
}

export function safeYouTubeUrl(value: unknown, topic = "learning") {
  if (typeof value === "string") {
    try {
      const url = new URL(value);
      if (url.hostname === "www.youtube.com" || url.hostname === "youtube.com" || url.hostname === "m.youtube.com") {
        if (url.pathname === "/watch" && url.searchParams.has("v")) return url.toString();
        if (url.pathname === "/results" && url.searchParams.has("search_query")) return url.toString();
      }
    } catch { /* use a safe search fallback */ }
  }
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(topic.trim().slice(0, 120))}`;
}

export function normalizeGeneratedCourse(input: unknown, topic: string): GeneratedCourse {
  const source = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const modules = Array.isArray(source.modules) ? source.modules : [];
  return {
    title: typeof source.title === "string" && source.title.trim() ? source.title.trim().slice(0, 160) : `${topic} Foundations`,
    description: typeof source.description === "string" ? source.description.trim().slice(0, 800) : `A practical learning path for ${topic}.`,
    skill_level: COURSE_SKILL_LEVELS.includes(source.skill_level as CourseSkillLevel) ? source.skill_level as CourseSkillLevel : "beginner",
    estimated_duration: typeof source.estimated_duration === "string" ? source.estimated_duration.slice(0, 80) : "4 weeks",
    modules: modules.slice(0, 12).map((module, index) => {
      const item = (module && typeof module === "object" ? module : {}) as Record<string, unknown>;
      const videos = Array.isArray(item.videos) ? item.videos : [];
      return {
        title: typeof item.title === "string" ? item.title.slice(0, 160) : `Module ${index + 1}`,
        description: typeof item.description === "string" ? item.description.slice(0, 500) : "Build this skill step by step.",
        videos: videos.slice(0, 8).map((video, videoIndex) => {
          const v = (video && typeof video === "object" ? video : {}) as Record<string, unknown>;
          return { title: typeof v.title === "string" ? v.title.slice(0, 160) : `Lesson ${videoIndex + 1}`, url: safeYouTubeUrl(v.url, `${topic} ${String(item.title ?? "")}`), duration: typeof v.duration === "string" ? v.duration.slice(0, 40) : undefined };
        }),
      };
    }),
  };
}
