"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  NotebookPen,
  Plus,
  Sparkles,
  Search,
  Star,
  Trash2,
  FileText,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Input } from "@/components/ui/Field";
import { Badge, relativeTime } from "@/components/ui/Badge";
import GenerateNoteDialog from "./GenerateNoteDialog";
import { createNote, deleteNote, toggleNoteFavorite } from "@/app/dashboard/notes/actions";
import { fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { NoteRow } from "@/lib/study/types";

interface Props {
  notes: NoteRow[];
  documents: { id: string; file_name: string | null }[];
}

const SOURCE_TONE = {
  ai: "indigo",
  pdf: "sky",
  manual: "neutral",
} as const;

const SOURCE_LABEL = {
  ai: "AI",
  pdf: "PDF",
  manual: "Manual",
} as const;

export default function NotesClient({ notes, documents }: Props) {
  const router = useRouter();

  const [items, setItems] = useState(notes);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<NoteRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    items.forEach((n) => n.subject && set.add(n.subject));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((n) => {
      if (onlyFavorites && !n.is_favorite) return false;
      if (subject && n.subject !== subject) return false;
      if (!q) return true;

      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.summary ?? "").toLowerCase().includes(q) ||
        (n.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [items, query, subject, onlyFavorites]);

  async function onCreateBlank() {
    const title = newTitle.trim();
    if (!title) {
      toast.error("Give the note a title.");
      return;
    }

    setCreating(true);
    try {
      const res = await createNote({ title });
      if (!res.ok || !res.data) throw new Error(res.error ?? "Could not create the note.");

      toast.success("Note created.");
      setNewOpen(false);
      setNewTitle("");
      router.push(`/dashboard/notes/${res.data.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the note.");
    } finally {
      setCreating(false);
    }
  }

  async function onToggleFavorite(note: NoteRow) {
    const next = !note.is_favorite;

    setItems((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, is_favorite: next } : n))
    );

    const res = await toggleNoteFavorite(note.id, next);
    if (!res.ok) {
      setItems((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, is_favorite: !next } : n))
      );
      toast.error(res.error ?? "Could not update the note.");
    }
  }

  async function onConfirmDelete() {
    if (!pendingDelete) return;

    setDeleting(true);
    try {
      const res = await deleteNote(pendingDelete.id);
      if (!res.ok) throw new Error(res.error ?? "Could not delete the note.");

      setItems((prev) => prev.filter((n) => n.id !== pendingDelete.id));
      toast.success("Note deleted.");
      setPendingDelete(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the note.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          icon={NotebookPen}
          title="AI Notes"
          subtitle="Generate structured study notes from a topic, pasted text, or an uploaded PDF."
          actions={
            <>
              <Button variant="secondary" onClick={() => setNewOpen(true)}>
                <Plus className="h-4 w-4" />
                Blank note
              </Button>
              <Button onClick={() => setGenerateOpen(true)}>
                <Sparkles className="h-4 w-4" />
                Generate with AI
              </Button>
            </>
          }
        />

        {items.length > 0 && (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-wrap items-center gap-3"
          >
            <motion.div variants={fadeUp} className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes, tags, content…"
                className="pl-10"
              />
            </motion.div>

            {subjects.length > 0 && (
              <motion.div variants={fadeUp} className="flex flex-wrap gap-1.5">
                <FilterChip
                  active={!subject}
                  onClick={() => setSubject("")}
                  label="All"
                />
                {subjects.map((s) => (
                  <FilterChip
                    key={s}
                    active={subject === s}
                    onClick={() => setSubject(subject === s ? "" : s)}
                    label={s}
                  />
                ))}
              </motion.div>
            )}

            <motion.div variants={fadeUp}>
              <FilterChip
                active={onlyFavorites}
                onClick={() => setOnlyFavorites((v) => !v)}
                label="Favorites"
                icon={<Star className="h-3 w-3" />}
              />
            </motion.div>
          </motion.div>
        )}

        {items.length === 0 ? (
          <EmptyState
            icon={NotebookPen}
            title="No notes yet"
            description="Generate your first set of study notes with AI, or start from a blank page."
            action={
              <Button onClick={() => setGenerateOpen(true)}>
                <Sparkles className="h-4 w-4" />
                Generate with AI
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No notes match those filters"
            description="Try a different search term, or clear the subject filter."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setSubject("");
                  setOnlyFavorites(false);
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((note) => (
              <motion.div key={note.id} variants={fadeUp}>
                <article
                  className={cn(
                    "group relative flex h-full flex-col rounded-2xl border border-white/[0.08]",
                    "bg-white/[0.03] p-5 transition-all duration-300",
                    "hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.05]",
                    "hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
                  )}
                >
                  <div className="mb-2.5 flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={SOURCE_TONE[note.source_type] ?? "neutral"}>
                        {note.source_type === "pdf" && (
                          <FileText className="h-3 w-3" />
                        )}
                        {SOURCE_LABEL[note.source_type] ?? note.source_type}
                      </Badge>
                      {note.subject && <Badge tone="purple">{note.subject}</Badge>}
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(note)}
                        aria-label={note.is_favorite ? "Unfavorite" : "Favorite"}
                        className={cn(
                          "rounded-lg p-1.5 transition-colors hover:bg-white/[0.06]",
                          note.is_favorite
                            ? "text-amber-400"
                            : "text-slate-600 hover:text-amber-400"
                        )}
                      >
                        <Star
                          className="h-4 w-4"
                          fill={note.is_favorite ? "currentColor" : "none"}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(note)}
                        aria-label="Delete note"
                        className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/notes/${note.id}`}
                    className="flex flex-1 flex-col"
                  >
                    <h3 className="text-[15px] font-semibold leading-snug text-white transition-colors group-hover:text-indigo-300">
                      {note.title}
                    </h3>

                    <p className="mt-1.5 line-clamp-3 flex-1 text-[13px] leading-relaxed text-slate-400">
                      {note.summary ||
                        note.content.replace(/[#*_`>\-]/g, "").slice(0, 180) ||
                        "Empty note — open it to start writing."}
                    </p>

                    {(note.tags ?? []).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {note.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-slate-500"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="mt-3 border-t border-white/[0.06] pt-2.5 text-[11px] text-slate-500">
                      Edited {relativeTime(note.updated_at)}
                    </p>
                  </Link>
                </article>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <GenerateNoteDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        documents={documents}
      />

      <Modal
        open={newOpen}
        onClose={() => !creating && setNewOpen(false)}
        title="New blank note"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setNewOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={onCreateBlank} loading={creating}>
              Create note
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void onCreateBlank();
          }}
        >
          <Input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Cell respiration — week 3"
            maxLength={200}
            disabled={creating}
          />
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      <Modal
        open={!!pendingDelete}
        onClose={() => !deleting && setPendingDelete(null)}
        title="Delete this note?"
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
          <span className="font-medium text-white">{pendingDelete?.title}</span> will be
          permanently removed, along with any decks or quizzes linked to it.
        </p>
      </Modal>
    </DashboardShell>
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
        "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all",
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
