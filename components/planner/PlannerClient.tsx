"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List,
  ListChecks,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Input } from "@/components/ui/Field";
import TaskCard, { PRIORITY_DOT } from "./TaskCard";
import TaskModal from "./TaskModal";
import PlanWithAIDialog from "./PlanWithAIDialog";
import { deleteTask, setTaskStatus } from "@/app/dashboard/planner/actions";
import { fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { PRIORITY_LABELS } from "@/lib/study/types";
import type {
  StudyTaskRow,
  TaskPriority,
  TaskStatus,
} from "@/lib/study/types";
import { dueBucket, isOverdue, isSameLocalDay, type DueBucket } from "./dates";

interface Props {
  tasks: StudyTaskRow[];
}

type ViewMode = "board" | "list";

const VIEW_STORAGE_KEY = "eduforge.planner.view";

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "done", label: "Done" },
];

const BUCKETS: { id: DueBucket; label: string }[] = [
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "week", label: "This week" },
  { id: "later", label: "Later" },
  { id: "none", label: "No date" },
];

const PRIORITIES: TaskPriority[] = ["high", "medium", "low"];

export default function PlannerClient({ tasks }: Props) {
  const router = useRouter();

  const [items, setItems] = useState<StudyTaskRow[]>(tasks);
  const [view, setView] = useState<ViewMode>("board");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [subject, setSubject] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StudyTaskRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StudyTaskRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(VIEW_STORAGE_KEY);
    // Syncing the persisted view choice from localStorage on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === "board" || saved === "list") setView(saved);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    items.forEach((t) => t.subject && set.add(t.subject));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((t) => {
      if (hideCompleted && t.status === "done") return false;
      if (priority && t.priority !== priority) return false;
      if (subject && t.subject !== subject) return false;
      if (q && !t.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, query, priority, subject, hideCompleted]);

  const stats = useMemo(() => {
    const now = new Date();
    let open = 0;
    let doneToday = 0;
    let minutesToday = 0;
    let overdue = 0;

    for (const t of items) {
      if (t.status !== "done") open += 1;
      if (isSameLocalDay(t.completed_at, now)) doneToday += 1;
      if (t.status !== "done" && isSameLocalDay(t.due_at, now))
        minutesToday += t.duration_minutes;
      if (isOverdue(t.due_at, t.status, now)) overdue += 1;
    }

    return { open, doneToday, minutesToday, overdue };
  }, [items]);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(task: StudyTaskRow) {
    setEditing(task);
    setModalOpen(true);
  }

  function onSaved(row: StudyTaskRow, isNew: boolean) {
    setItems((prev) => {
      const exists = prev.some((t) => t.id === row.id);
      if (isNew && !exists) return [...prev, row];
      return prev.map((t) => (t.id === row.id ? row : t));
    });
    router.refresh();
  }

  function onCommitted(rows: StudyTaskRow[]) {
    setItems((prev) => [...prev, ...rows]);
  }

  async function changeStatus(task: StudyTaskRow, status: TaskStatus) {
    if (task.status === status) return;

    const snapshot = task;
    setItems((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status,
              completed_at: status === "done" ? new Date().toISOString() : null,
            }
          : t
      )
    );

    const res = await setTaskStatus(task.id, status);
    if (!res.ok || !res.data) {
      setItems((prev) => prev.map((t) => (t.id === task.id ? snapshot : t)));
      toast.error(res.error ?? "Could not move the task.");
      return;
    }

    setItems((prev) => prev.map((t) => (t.id === task.id ? res.data! : t)));
    if (status === "done") toast.success("Task completed.");
  }

  function toggleComplete(task: StudyTaskRow) {
    void changeStatus(task, task.status === "done" ? "todo" : "done");
  }

  function handleDrop(status: TaskStatus) {
    const id = draggingId;
    setDragOver(null);
    setDraggingId(null);
    if (!id) return;
    const task = items.find((t) => t.id === id);
    if (task) void changeStatus(task, status);
  }

  async function onConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await deleteTask(pendingDelete.id);
      if (!res.ok) throw new Error(res.error ?? "Could not delete the task.");
      setItems((prev) => prev.filter((t) => t.id !== pendingDelete.id));
      toast.success("Task deleted.");
      setPendingDelete(null);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete the task."
      );
    } finally {
      setDeleting(false);
    }
  }

  function clearFilters() {
    setQuery("");
    setPriority("");
    setSubject("");
    setHideCompleted(false);
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          icon={CalendarDays}
          title="Study Planner"
          subtitle="Organise your study tasks on a board or by due date, and let AI draft a plan."
          actions={
            <>
              <Button variant="secondary" onClick={openNew}>
                <Plus className="h-4 w-4" />
                Add task
              </Button>
              <Button onClick={() => setAiOpen(true)}>
                <Sparkles className="h-4 w-4" />
                Plan my study with AI
              </Button>
            </>
          }
        />

        {items.length > 0 && (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Stat icon={ListChecks} label="Open tasks" value={stats.open} />
            <Stat
              icon={CheckCircle2}
              label="Done today"
              value={stats.doneToday}
              tone="emerald"
            />
            <Stat
              icon={Clock}
              label="Planned today"
              value={`${stats.minutesToday}m`}
            />
            <Stat
              icon={AlertCircle}
              label="Overdue"
              value={stats.overdue}
              tone={stats.overdue > 0 ? "rose" : undefined}
            />
          </motion.div>
        )}

        {items.length > 0 && (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center gap-3"
            >
              <div className="relative min-w-[220px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tasks…"
                  className="pl-10"
                />
              </div>

              <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-0.5">
                <ViewButton
                  active={view === "board"}
                  onClick={() => setView("board")}
                  label="Board"
                  icon={<LayoutGrid className="h-3.5 w-3.5" />}
                />
                <ViewButton
                  active={view === "list"}
                  onClick={() => setView("list")}
                  label="List"
                  icon={<List className="h-3.5 w-3.5" />}
                />
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center gap-1.5"
            >
              <FilterChip active={!priority} onClick={() => setPriority("")} label="All priorities" />
              {PRIORITIES.map((p) => (
                <FilterChip
                  key={p}
                  active={priority === p}
                  onClick={() => setPriority(priority === p ? "" : p)}
                  label={PRIORITY_LABELS[p]}
                  icon={
                    <span className={cn("h-2 w-2 rounded-full", PRIORITY_DOT[p])} />
                  }
                />
              ))}

              {subjects.length > 0 && (
                <>
                  <span className="mx-1 h-4 w-px bg-white/10" />
                  <FilterChip active={!subject} onClick={() => setSubject("")} label="All subjects" />
                  {subjects.map((s) => (
                    <FilterChip
                      key={s}
                      active={subject === s}
                      onClick={() => setSubject(subject === s ? "" : s)}
                      label={s}
                    />
                  ))}
                </>
              )}

              <span className="mx-1 h-4 w-px bg-white/10" />
              <FilterChip
                active={hideCompleted}
                onClick={() => setHideCompleted((v) => !v)}
                label="Hide completed"
                icon={<CheckCircle2 className="h-3 w-3" />}
              />
            </motion.div>
          </motion.div>
        )}

        {items.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No tasks yet"
            description="Add your first study task, or let AI turn a goal into a full day-by-day plan."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="secondary" onClick={openNew}>
                  <Plus className="h-4 w-4" />
                  Add task
                </Button>
                <Button onClick={() => setAiOpen(true)}>
                  <Sparkles className="h-4 w-4" />
                  Plan with AI
                </Button>
              </div>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Nothing matches those filters"
            description="Try a different search term, or clear the priority and subject filters."
            action={
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : view === "board" ? (
          <div className="grid gap-4 md:grid-cols-3">
            {COLUMNS.map((col) => {
              const columnTasks = filtered.filter((t) => t.status === col.id);
              return (
                <div key={col.id} className="flex flex-col">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                      {col.label}
                    </h2>
                    <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-slate-400">
                      {columnTasks.length}
                    </span>
                  </div>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(col.id);
                    }}
                    onDragLeave={(e) => {
                      if (e.currentTarget.contains(e.relatedTarget as Node))
                        return;
                      setDragOver((s) => (s === col.id ? null : s));
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop(col.id);
                    }}
                    className={cn(
                      "flex min-h-[200px] flex-col gap-3 rounded-2xl border",
                      "border-white/[0.06] bg-white/[0.02] p-3 transition-colors",
                      dragOver === col.id &&
                        "border-indigo-500/50 bg-indigo-500/10"
                    )}
                  >
                    {columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onOpen={() => openEdit(task)}
                        onToggleComplete={() => toggleComplete(task)}
                        onDelete={() => setPendingDelete(task)}
                        draggable
                        dragging={draggingId === task.id}
                        onDragStart={(e) => {
                          setDraggingId(task.id);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", task.id);
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setDragOver(null);
                        }}
                      />
                    ))}

                    {columnTasks.length === 0 && (
                      <p className="py-8 text-center text-[12px] text-slate-600">
                        Drop tasks here
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            {BUCKETS.map((bucket) => {
              const group = filtered.filter(
                (t) => dueBucket(t.due_at, t.status) === bucket.id
              );
              if (group.length === 0) return null;
              return (
                <div key={bucket.id}>
                  <h2
                    className={cn(
                      "mb-3 text-sm font-semibold uppercase tracking-wider",
                      bucket.id === "overdue" ? "text-rose-400" : "text-slate-400"
                    )}
                  >
                    {bucket.label}
                    <span className="ml-2 text-[11px] font-normal normal-case text-slate-600">
                      {group.length}
                    </span>
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onOpen={() => openEdit(task)}
                        onToggleComplete={() => toggleComplete(task)}
                        onDelete={() => setPendingDelete(task)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TaskModal
        open={modalOpen}
        task={editing}
        onClose={() => setModalOpen(false)}
        onSaved={onSaved}
      />

      <PlanWithAIDialog
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onCommitted={onCommitted}
      />

      <Modal
        open={!!pendingDelete}
        onClose={() => !deleting && setPendingDelete(null)}
        title="Delete this task?"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setPendingDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirmDelete} loading={deleting}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-slate-400">
          <span className="font-medium text-white">{pendingDelete?.title}</span>{" "}
          will be permanently removed from your plan.
        </p>
      </Modal>
    </DashboardShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  tone?: "emerald" | "rose";
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4"
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          tone === "emerald"
            ? "bg-emerald-500/15 text-emerald-400"
            : tone === "rose"
              ? "bg-rose-500/15 text-rose-400"
              : "bg-indigo-500/15 text-indigo-300"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="text-xl font-semibold text-white">{value}</p>
      </div>
    </motion.div>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all",
        active
          ? "bg-indigo-500/20 text-indigo-200"
          : "text-slate-400 hover:text-white"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all",
        active
          ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-200"
          : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
