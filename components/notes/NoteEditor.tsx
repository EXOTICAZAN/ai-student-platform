"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Eye,
  Layers,
  HelpCircle,
  PenLine,
  Save,
  Sparkles,
  Star,
  Trash2,
  Cloud,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import MarkdownRenderer from "@/components/chat/MarkdownRenderer";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Input } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import {
  deleteNote,
  toggleNoteFavorite,
  updateNote,
} from "@/app/dashboard/notes/actions";
import { cn } from "@/lib/utils";
import type { NoteRow } from "@/lib/study/types";

type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY = 1200;

export default function NoteEditor({ note }: { note: NoteRow }) {
  const router = useRouter();

  const [title, setTitle] = useState(note.title);
  const [subject, setSubject] = useState(note.subject ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(note.tags ?? []);
  const [content, setContent] = useState(note.content);
  const [summary, setSummary] = useState(note.summary ?? "");
  const [favorite, setFavorite] = useState(note.is_favorite);

  const [preview, setPreview] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [summarizing, setSummarizing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ title, subject, tags, content, summary });

  useEffect(() => {
    latest.current = { title, subject, tags, content, summary };
  }, [title, subject, tags, content, summary]);

  const persist = useCallback(
    async (silent: boolean) => {
      const snapshot = latest.current;

      if (!snapshot.title.trim()) {
        if (!silent) toast.error("A title is required.");
        return false;
      }

      setSaveState("saving");

      const res = await updateNote(note.id, {
        title: snapshot.title,
        subject: snapshot.subject,
        tags: snapshot.tags,
        content: snapshot.content,
        summary: snapshot.summary,
      });

      if (!res.ok) {
        setSaveState("error");
        if (!silent) toast.error(res.error ?? "Could not save the note.");
        return false;
      }

      dirty.current = false;
      setHasUnsaved(false);
      setSaveState("saved");
      if (!silent) toast.success("Note saved.");
      return true;
    },
    [note.id]
  );

  const scheduleAutosave = useCallback(() => {
    dirty.current = true;
    setHasUnsaved(true);
    setSaveState("idle");

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void persist(true);
    }, AUTOSAVE_DELAY);
  }, [persist]);

  // Flush pending edits before leaving the page.
  useEffect(() => {
    const flush = () => {
      if (dirty.current) void persist(true);
    };

    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      if (timer.current) clearTimeout(timer.current);
      flush();
    };
  }, [persist]);

  async function onSave() {
    if (timer.current) clearTimeout(timer.current);
    await persist(false);
    router.refresh();
  }

  async function onSummarize() {
    if (content.trim().length < 40) {
      toast.error("Write a bit more before summarising.");
      return;
    }

    setSummarizing(true);
    try {
      const res = await fetch("/api/notes/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, persist: false }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Could not summarise.");

      setSummary(body.data.summary);
      scheduleAutosave();
      toast.success("Summary generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not summarise.");
    } finally {
      setSummarizing(false);
    }
  }

  function addTag() {
    const tag = tagInput.trim().replace(/^#/, "");
    if (!tag) return;
    if (tags.includes(tag)) {
      setTagInput("");
      return;
    }
    if (tags.length >= 8) {
      toast.error("Up to 8 tags per note.");
      return;
    }

    setTags([...tags, tag]);
    setTagInput("");
    scheduleAutosave();
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
    scheduleAutosave();
  }

  async function onToggleFavorite() {
    const next = !favorite;
    setFavorite(next);

    const res = await toggleNoteFavorite(note.id, next);
    if (!res.ok) {
      setFavorite(!next);
      toast.error(res.error ?? "Could not update the note.");
    }
  }

  async function onConfirmDelete() {
    setDeleting(true);
    try {
      const res = await deleteNote(note.id);
      if (!res.ok) throw new Error(res.error ?? "Could not delete the note.");

      toast.success("Note deleted.");
      router.push("/dashboard/notes");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the note.");
      setDeleting(false);
    }
  }

  const statusLabel: Record<SaveState, string> = {
    idle: hasUnsaved ? "Unsaved changes" : "All changes saved",
    saving: "Saving…",
    saved: "Saved",
    error: "Save failed",
  };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard/notes"
            className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            All notes
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-1.5 text-[11px]",
                saveState === "error" ? "text-rose-400" : "text-slate-500"
              )}
            >
              <Cloud className="h-3 w-3" />
              {statusLabel[saveState]}
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreview((v) => !v)}
              aria-pressed={preview}
            >
              {preview ? <PenLine className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {preview ? "Edit" : "Preview"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onSummarize}
              loading={summarizing}
            >
              {!summarizing && <Sparkles className="h-4 w-4" />}
              Summarise
            </Button>

            <Button variant="ghost" size="sm" onClick={onToggleFavorite}>
              <Star
                className={cn("h-4 w-4", favorite && "text-amber-400")}
                fill={favorite ? "currentColor" : "none"}
              />
            </Button>

            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4 text-rose-400" />
            </Button>

            <Button size="sm" onClick={onSave} loading={saveState === "saving"}>
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              scheduleAutosave();
            }}
            placeholder="Note title"
            maxLength={200}
            className="border-transparent bg-transparent px-0 text-xl font-bold text-white focus:border-transparent focus:bg-transparent focus:ring-0"
          />

          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                scheduleAutosave();
              }}
              placeholder="Subject"
              className="h-9 w-44 py-1.5 text-[13px]"
            />

            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag} tone="indigo">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove ${tag}`}
                    className="ml-0.5 text-indigo-300/60 transition-colors hover:text-white"
                  >
                    ×
                  </button>
                </Badge>
              ))}

              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                onBlur={addTag}
                placeholder="+ tag"
                className="h-7 w-24 px-2 py-0 text-[12px]"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Link href={`/dashboard/flashcards?noteId=${note.id}`}>
                <Button variant="secondary" size="sm">
                  <Layers className="h-3.5 w-3.5" />
                  Make flashcards
                </Button>
              </Link>
              <Link href={`/dashboard/quiz?noteId=${note.id}`}>
                <Button variant="secondary" size="sm">
                  <HelpCircle className="h-3.5 w-3.5" />
                  Make quiz
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          {preview ? (
            <div className="prose prose-invert max-w-none">
              {content.trim() ? (
                <MarkdownRenderer content={content} />
              ) : (
                <p className="text-sm text-slate-500">
                  Nothing to preview yet — switch back to Edit and start writing.
                </p>
              )}
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                scheduleAutosave();
              }}
              placeholder="Write in markdown — headings, lists, tables and $LaTeX$ are all rendered in Preview…"
              className={cn(
                "min-h-[55vh] w-full resize-y rounded-xl border border-white/10 bg-white/[0.04]",
                "p-4 font-mono text-[13px] leading-relaxed text-slate-100 outline-none transition-all",
                "placeholder:text-slate-600 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20"
              )}
            />
          )}
        </div>

        {/* Summary */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Summary
            </h2>
            <Button variant="ghost" size="sm" onClick={onSummarize} loading={summarizing}>
              {!summarizing && <Sparkles className="h-3.5 w-3.5" />}
              Generate
            </Button>
          </div>
          <textarea
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value);
              scheduleAutosave();
            }}
            placeholder="A 2-3 sentence overview — shown on the note card."
            className={cn(
              "min-h-[80px] w-full resize-y rounded-xl border border-white/10 bg-white/[0.04]",
              "p-3 text-[13px] leading-relaxed text-slate-100 outline-none transition-all",
              "placeholder:text-slate-600 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20"
            )}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pb-4">
          {saveState === "saved" && (
            <span className="flex items-center gap-1 text-[12px] text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              Saved
            </span>
          )}
          <Button onClick={onSave} loading={saveState === "saving"}>
            <Save className="h-4 w-4" />
            Save note
          </Button>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => !deleting && setConfirmDelete(false)}
        title="Delete this note?"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setConfirmDelete(false)}
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
          <span className="font-medium text-white">{title}</span> will be permanently
          removed. Decks and quizzes generated from it are kept.
        </p>
      </Modal>
    </DashboardShell>
  );
}
