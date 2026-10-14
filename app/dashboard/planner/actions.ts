"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity, XP } from "@/lib/study/activity";
import type {
  ActionResult,
  StudyTaskRow,
  TaskPriority,
  TaskStatus,
} from "@/lib/study/types";
import { actionAllowed, ACTION_LIMIT_ERROR } from "@/lib/api/actionLimit";

// =============================================================
// Study Planner — mutations.
// Returns an ActionResult envelope so the UI can toast real
// errors instead of failing silently.
// =============================================================

export interface TaskInput {
  title: string;
  description?: string | null;
  subject?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_at?: string | null;
  duration_minutes?: number;
}

export type BulkTaskInput = TaskInput;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

function normalizeDuration(value: number | undefined): number {
  const n = Math.round(Number(value ?? 30));
  if (!Number.isFinite(n) || n <= 0) return 30;
  return Math.min(Math.max(n, 5), 1440);
}

function revalidate() {
  revalidatePath("/dashboard/planner");
  revalidatePath("/dashboard");
}

export async function createTask(
  input: TaskInput
): Promise<ActionResult<StudyTaskRow>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("planner", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  const title = input.title?.trim();
  if (!title) return { ok: false, error: "A title is required." };

  const status: TaskStatus = input.status ?? "todo";

  const { data, error } = await supabase
    .from("study_tasks")
    .insert({
      user_id: user.id,
      title,
      description: input.description?.trim() || null,
      subject: input.subject?.trim() || null,
      priority: input.priority ?? "medium",
      status,
      due_at: input.due_at ?? null,
      duration_minutes: normalizeDuration(input.duration_minutes),
      completed_at: status === "done" ? new Date().toISOString() : null,
      sort_order: 0,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[planner] create failed:", error?.message);
    return { ok: false, error: "Could not create the task." };
  }

  revalidate();

  await logActivity({
    type: "task",
    label: `Created task · ${title}`,
    xp: XP.task_created,
    metadata: { task_id: data.id, subject: data.subject },
  });

  return { ok: true, data };
}

export async function updateTask(
  taskId: string,
  patch: Partial<TaskInput>
): Promise<ActionResult<StudyTaskRow>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("planner", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  const payload: Record<string, unknown> = {};

  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (!title) return { ok: false, error: "A title is required." };
    payload.title = title;
  }
  if (patch.description !== undefined)
    payload.description = patch.description?.trim() || null;
  if (patch.subject !== undefined)
    payload.subject = patch.subject?.trim() || null;
  if (patch.priority !== undefined) payload.priority = patch.priority;
  if (patch.due_at !== undefined) payload.due_at = patch.due_at;
  if (patch.duration_minutes !== undefined)
    payload.duration_minutes = normalizeDuration(patch.duration_minutes);
  if (patch.status !== undefined) {
    payload.status = patch.status;
    payload.completed_at =
      patch.status === "done" ? new Date().toISOString() : null;
  }

  const { data, error } = await supabase
    .from("study_tasks")
    .update(payload)
    .eq("id", taskId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !data) {
    console.error("[planner] update failed:", error?.message);
    return { ok: false, error: "Could not save the task." };
  }

  revalidate();
  return { ok: true, data };
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("planner", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  const { error } = await supabase
    .from("study_tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[planner] delete failed:", error.message);
    return { ok: false, error: "Could not delete the task." };
  }

  revalidate();
  return { ok: true };
}

export async function setTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<ActionResult<StudyTaskRow>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("planner", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  const { data, error } = await supabase
    .from("study_tasks")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !data) {
    console.error("[planner] status failed:", error?.message);
    return { ok: false, error: "Could not update the task." };
  }

  revalidate();

  if (status === "done") {
    await logActivity({
      type: "task",
      label: `Completed task · ${data.title}`,
      xp: XP.task_completed,
      metadata: { minutes: data.duration_minutes, task_id: data.id },
    });
  }

  return { ok: true, data };
}

export async function createTasksBulk(
  tasks: BulkTaskInput[]
): Promise<ActionResult<StudyTaskRow[]>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await actionAllowed("planner", user.id))) return { ok: false, error: ACTION_LIMIT_ERROR };

  // The array arrives from an AI-generated plan, so both its length and the
  // priority strings are untrusted input rather than a compile-time guarantee.
  const PRIORITIES: TaskPriority[] = ["low", "medium", "high"];
  const MAX_BULK_TASKS = 100;

  if (!Array.isArray(tasks)) return { ok: false, error: "No tasks to add." };
  if (tasks.length > MAX_BULK_TASKS) {
    return { ok: false, error: `A plan can add at most ${MAX_BULK_TASKS} tasks at once.` };
  }

  const rows = tasks
    .filter((t) => t.title?.trim())
    .map((t, i) => ({
      user_id: user.id,
      title: t.title.trim().slice(0, 200),
      description: t.description?.trim().slice(0, 2000) || null,
      subject: t.subject?.trim().slice(0, 120) || null,
      priority: PRIORITIES.includes(t.priority as TaskPriority)
        ? (t.priority as TaskPriority)
        : "medium",
      status: "todo" as TaskStatus,
      due_at: t.due_at ?? null,
      duration_minutes: normalizeDuration(t.duration_minutes),
      completed_at: null,
      sort_order: i,
    }));

  if (rows.length === 0) return { ok: false, error: "No tasks to add." };

  const { data, error } = await supabase
    .from("study_tasks")
    .insert(rows)
    .select();

  if (error || !data) {
    console.error("[planner] bulk create failed:", error?.message);
    return { ok: false, error: "Could not add the plan." };
  }

  revalidate();

  const totalMinutes = rows.reduce((sum, r) => sum + r.duration_minutes, 0);
  await logActivity({
    type: "task",
    label: `Added AI study plan · ${rows.length} tasks`,
    xp: XP.task_created * rows.length,
    metadata: { minutes: totalMinutes, count: rows.length },
  });

  return { ok: true, data };
}
