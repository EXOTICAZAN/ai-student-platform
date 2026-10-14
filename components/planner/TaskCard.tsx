"use client";

import { Calendar, CheckCircle2, Circle, Clock, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { PRIORITY_LABELS } from "@/lib/study/types";
import type { StudyTaskRow, TaskPriority } from "@/lib/study/types";
import { dueBucket, formatDue } from "./dates";

export const PRIORITY_DOT: Record<TaskPriority, string> = {
  high: "bg-rose-500",
  medium: "bg-amber-500",
  low: "bg-slate-500",
};

interface Props {
  task: StudyTaskRow;
  onOpen: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
  draggable?: boolean;
  dragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export default function TaskCard({
  task,
  onOpen,
  onToggleComplete,
  onDelete,
  draggable = false,
  dragging = false,
  onDragStart,
  onDragEnd,
}: Props) {
  const done = task.status === "done";
  const overdue = dueBucket(task.due_at, task.status) === "overdue";

  return (
    <article
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-2 rounded-2xl border",
        "border-white/[0.08] bg-white/[0.03] p-4 transition-all duration-200",
        "hover:border-white/15 hover:bg-white/[0.06]",
        draggable && "cursor-grab active:cursor-grabbing",
        dragging && "opacity-40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {task.subject && <Badge tone="purple">{task.subject}</Badge>}
          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                PRIORITY_DOT[task.priority]
              )}
            />
            {PRIORITY_LABELS[task.priority]}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete task"
            className="rounded-lg p-1 text-slate-600 opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete();
            }}
            aria-label={done ? "Mark as not done" : "Mark complete"}
            className={cn(
              "rounded-full p-0.5 transition-colors",
              done
                ? "text-emerald-400"
                : "text-slate-600 hover:text-emerald-400"
            )}
          >
            {done ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <h3
        className={cn(
          "text-[14px] font-medium leading-snug",
          done ? "text-slate-500 line-through" : "text-white"
        )}
      >
        {task.title}
      </h3>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {task.duration_minutes}m
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1",
            overdue && "font-medium text-rose-400"
          )}
        >
          <Calendar className="h-3 w-3" />
          {formatDue(task.due_at)}
        </span>
      </div>
    </article>
  );
}
