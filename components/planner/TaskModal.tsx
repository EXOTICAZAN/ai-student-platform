"use client";

import { useState } from "react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { createTask, updateTask } from "@/app/dashboard/planner/actions";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/study/types";
import type {
  StudyTaskRow,
  TaskPriority,
  TaskStatus,
} from "@/lib/study/types";
import { fromDateTimeLocal, toDateTimeLocal } from "./dates";

interface Props {
  open: boolean;
  task: StudyTaskRow | null;
  onClose: () => void;
  onSaved: (row: StudyTaskRow, isNew: boolean) => void;
}

export default function TaskModal({ open, task, onClose, onSaved }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? "Edit task" : "Add task"}
      size="md"
    >
      {open && (
        <TaskForm
          key={task?.id ?? "new"}
          task={task}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Modal>
  );
}

function TaskForm({
  task,
  onClose,
  onSaved,
}: {
  task: StudyTaskRow | null;
  onClose: () => void;
  onSaved: (row: StudyTaskRow, isNew: boolean) => void;
}) {
  const isNew = !task;

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [subject, setSubject] = useState(task?.subject ?? "");
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? "medium"
  );
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo");
  const [dueLocal, setDueLocal] = useState(toDateTimeLocal(task?.due_at));
  const [duration, setDuration] = useState(String(task?.duration_minutes ?? 30));
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    if (busy) return;

    const trimmed = title.trim();
    if (!trimmed) {
      toast.error("Give the task a title.");
      return;
    }

    const payload = {
      title: trimmed,
      description: description.trim() || null,
      subject: subject.trim() || null,
      priority,
      status,
      due_at: fromDateTimeLocal(dueLocal),
      duration_minutes: Number(duration) || 30,
    };

    setBusy(true);
    try {
      const res = task
        ? await updateTask(task.id, payload)
        : await createTask(payload);

      if (!res.ok || !res.data) {
        throw new Error(res.error ?? "Could not save the task.");
      }

      toast.success(isNew ? "Task added." : "Task updated.");
      onSaved(res.data, isNew);
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save the task."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit();
      }}
    >
      <Field label="Title">
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Practise 10 eigenvector problems"
          maxLength={200}
          disabled={busy}
        />
      </Field>

      <Field label="Description">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details…"
          className="min-h-[90px]"
          disabled={busy}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Subject">
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Linear Algebra"
            disabled={busy}
          />
        </Field>
        <Field label="Duration (minutes)">
          <Input
            type="number"
            min={5}
            max={1440}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            disabled={busy}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Priority">
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            disabled={busy}
          >
            {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            disabled={busy}
          >
            {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Due date & time">
        <Input
          type="datetime-local"
          value={dueLocal}
          onChange={(e) => setDueLocal(e.target.value)}
          disabled={busy}
        />
      </Field>

      <div className="flex items-center justify-end gap-2 border-t border-white/[0.07] pt-4">
        <Button variant="ghost" type="button" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          {isNew ? "Add task" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
