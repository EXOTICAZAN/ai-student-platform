"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Circle, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { ease } from "@/lib/motion";
import { formatDue, isOverdue } from "@/components/planner/dates";
import { setTaskStatus } from "@/app/dashboard/planner/actions";
import type { StudyTaskRow, TaskPriority } from "@/lib/study/types";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const priorityColor: Record<TaskPriority, string> = {
  high: "bg-rose-500",
  medium: "bg-amber-500",
  low: "bg-slate-500",
};

interface UpcomingTasksProps {
  tasks: StudyTaskRow[];
}

export default function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [pending, startTransition] = useTransition();

  function complete(task: StudyTaskRow) {
    startTransition(async () => {
      const res = await setTaskStatus(task.id, "done");
      if (!res.ok) {
        toast.error(res.error ?? "Could not complete the task.");
        return;
      }
      toast.success(t("taskCompleted"));
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          {t("upcomingTasks")}
        </h2>
        <Link
          href="/dashboard/planner"
          className="text-[12px] text-indigo-400 transition-colors hover:text-indigo-300"
        >
          {t("openPlanner")}
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <CalendarPlus className="h-6 w-6 text-slate-600" />
          <p className="max-w-[26ch] text-[13px] leading-relaxed text-slate-500">
            {t("noOpenTasks")}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task, i) => {
            const overdue = isOverdue(task.due_at, task.status);

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + i * 0.05, ease }}
                className="flex items-start gap-3 rounded-xl border border-transparent px-2 py-2.5 transition-colors hover:border-white/[0.06] hover:bg-white/[0.03]"
              >
                <div
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priorityColor[task.priority]}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-slate-200">{task.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span className={overdue ? "text-rose-400" : undefined}>
                      {task.due_at ? formatDue(task.due_at) : t("noDate")}
                    </span>
                    <span>· {task.duration_minutes} min</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => complete(task)}
                  disabled={pending}
                  className="mt-0.5 shrink-0 text-slate-600 transition-colors hover:text-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Mark "${task.title}" complete`}
                  title={t("markComplete")}
                >
                  <Circle className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
