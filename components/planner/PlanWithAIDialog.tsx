"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calendar, Check, Clock, Sparkles } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { createTasksBulk } from "@/app/dashboard/planner/actions";
import { PRIORITY_LABELS } from "@/lib/study/types";
import type { StudyTaskRow, TaskPriority } from "@/lib/study/types";
import { cn } from "@/lib/utils";
import { PRIORITY_DOT } from "./TaskCard";
import { formatDue } from "./dates";

interface PlanTask {
  title: string;
  description: string;
  subject: string;
  priority: TaskPriority;
  duration_minutes: number;
  due_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCommitted: (rows: StudyTaskRow[]) => void;
}

export default function PlanWithAIDialog({
  open,
  onClose,
  onCommitted,
}: Props) {
  const router = useRouter();

  const [phase, setPhase] = useState<"form" | "preview">("form");
  const [goal, setGoal] = useState("");
  const [subject, setSubject] = useState("");
  const [days, setDays] = useState("7");
  const [minutesPerDay, setMinutesPerDay] = useState("60");
  const [examDate, setExamDate] = useState("");
  const [focusAreas, setFocusAreas] = useState("");
  const [busy, setBusy] = useState(false);
  const [generated, setGenerated] = useState<PlanTask[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);

  function reset() {
    setPhase("form");
    setGoal("");
    setSubject("");
    setDays("7");
    setMinutesPerDay("60");
    setExamDate("");
    setFocusAreas("");
    setGenerated([]);
    setSelected([]);
  }

  function close() {
    if (busy) return;
    reset();
    onClose();
  }

  async function onGenerate() {
    if (busy) return;
    if (!goal.trim()) {
      toast.error("Describe your goal first.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: goal.trim(),
          subject: subject.trim() || undefined,
          days: Number(days) || 7,
          minutesPerDay: Number(minutesPerDay) || 60,
          examDate: examDate || undefined,
          focusAreas: focusAreas.trim() || undefined,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Generation failed.");
      }

      const tasks = (body.data ?? []) as PlanTask[];
      if (tasks.length === 0) {
        throw new Error("The model returned no tasks. Try again.");
      }

      setGenerated(tasks);
      setSelected(tasks.map(() => true));
      setPhase("preview");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Generation failed."
      );
    } finally {
      setBusy(false);
    }
  }

  const selectedCount = selected.filter(Boolean).length;

  async function onCommit() {
    if (busy) return;
    const chosen = generated.filter((_, i) => selected[i]);
    if (chosen.length === 0) {
      toast.error("Select at least one task.");
      return;
    }

    setBusy(true);
    try {
      const res = await createTasksBulk(
        chosen.map((t) => ({
          title: t.title,
          description: t.description || null,
          subject: t.subject || subject.trim() || null,
          priority: t.priority,
          duration_minutes: t.duration_minutes,
          due_at: t.due_at || null,
        }))
      );

      if (!res.ok || !res.data) {
        throw new Error(res.error ?? "Could not add the plan.");
      }

      toast.success(`Added ${res.data.length} tasks to your plan.`);
      onCommitted(res.data);
      router.refresh();
      reset();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not add the plan."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Plan my study with AI"
      description={
        phase === "form"
          ? "Describe your goal and EduForge builds a day-by-day plan you can edit before saving."
          : "Uncheck anything you don't want, then add the rest to your plan."
      }
      size="lg"
      footer={
        phase === "form" ? (
          <>
            <Button variant="ghost" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={onGenerate} loading={busy}>
              <Sparkles className="h-4 w-4" />
              {busy ? "Planning…" : "Generate plan"}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              onClick={() => setPhase("form")}
              disabled={busy}
            >
              Back
            </Button>
            <Button onClick={onCommit} loading={busy}>
              <Check className="h-4 w-4" />
              Add {selectedCount} task{selectedCount === 1 ? "" : "s"} to my plan
            </Button>
          </>
        )
      }
    >
      {phase === "form" ? (
        <div className="space-y-4">
          <Field
            label="Goal"
            hint="What do you want to achieve? Be specific."
          >
            <Textarea
              autoFocus
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Pass my linear algebra exam, focusing on eigenvalues and vector spaces."
              className="min-h-[100px]"
              disabled={busy}
              maxLength={600}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Subject (optional)">
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Linear Algebra"
                disabled={busy}
              />
            </Field>
            <Field label="Exam / target date (optional)">
              <Input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                disabled={busy}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Days" hint="1–30">
              <Input
                type="number"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                disabled={busy}
              />
            </Field>
            <Field label="Minutes per day" hint="15–480">
              <Input
                type="number"
                min={15}
                max={480}
                value={minutesPerDay}
                onChange={(e) => setMinutesPerDay(e.target.value)}
                disabled={busy}
              />
            </Field>
          </div>

          <Field
            label="Focus areas (optional)"
            hint="Comma-separated topics or weak spots."
          >
            <Input
              value={focusAreas}
              onChange={(e) => setFocusAreas(e.target.value)}
              placeholder="Eigenvalues, diagonalisation, vector spaces"
              disabled={busy}
            />
          </Field>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[12px] text-slate-400">
              {generated.length} tasks generated
            </p>
            <div className="flex gap-2 text-[12px]">
              <button
                type="button"
                onClick={() => setSelected(generated.map(() => true))}
                className="text-indigo-300 hover:text-indigo-200"
              >
                Select all
              </button>
              <span className="text-slate-600">·</span>
              <button
                type="button"
                onClick={() => setSelected(generated.map(() => false))}
                className="text-slate-400 hover:text-white"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {generated.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() =>
                  setSelected((prev) =>
                    prev.map((v, idx) => (idx === i ? !v : v))
                  )
                }
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all",
                  selected[i]
                    ? "border-indigo-500/40 bg-indigo-500/10"
                    : "border-white/[0.08] bg-white/[0.02] opacity-60 hover:border-white/15"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    selected[i]
                      ? "border-indigo-400 bg-indigo-500 text-white"
                      : "border-white/20"
                  )}
                >
                  {selected[i] && <Check className="h-3.5 w-3.5" />}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-white">
                    {t.title}
                  </span>
                  {t.description && (
                    <span className="mt-0.5 block line-clamp-2 text-[12px] text-slate-400">
                      {t.description}
                    </span>
                  )}
                  <span className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          PRIORITY_DOT[t.priority]
                        )}
                      />
                      {PRIORITY_LABELS[t.priority]}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t.duration_minutes}m
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDue(t.due_at)}
                    </span>
                    {t.subject && (
                      <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-slate-400">
                        {t.subject}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
