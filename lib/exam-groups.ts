import { z } from "zod";

export const EXAM_CATALOGUE = [
  { key: "NET", name: "NUST Entry Test (NET)" },
  { key: "ECAT", name: "ECAT" },
  { key: "MDCAT", name: "MDCAT" },
  { key: "LUMS", name: "LUMS Entrance Test" },
  { key: "NTS", name: "NTS" },
  { key: "FAST", name: "FAST-NUCES Entry Test" },
  { key: "GIKI", name: "GIKI Entrance Test" },
  { key: "PIEAS", name: "PIEAS Entry Test" },
  { key: "UNIVERSITY", name: "University entrance tests" },
  { key: "OTHER", name: "Other" },
] as const;

export const examKeySchema = z.enum(EXAM_CATALOGUE.map((exam) => exam.key) as [string, ...string[]]);
export const createGroupSchema = z.object({
  exam_key: examKeySchema,
  exam_name: z.string().trim().min(1).max(120),
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().max(1000).optional().default(""),
  province: z.string().trim().max(60).optional().default(""),
  city: z.string().trim().max(80).optional().default(""),
  max_members: z.coerce.number().int().min(2).max(500).default(50),
});
export const postSchema = z.object({
  body: z.string().trim().min(1).max(4000),
  resource_url: z.string().trim().url().max(500).optional().or(z.literal("")),
});
export const uuidSchema = z.string().uuid();
export const isValidExamKey = (key: string) => EXAM_CATALOGUE.some((exam) => exam.key === key);
