"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, FileText, Type, NotebookPen } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Field, Input, Textarea, Select } from "@/components/ui/Field";
import { createNote } from "@/app/dashboard/notes/actions";
import { cn } from "@/lib/utils";
import type { GeneratedNote } from "@/lib/study/types";

type Mode = "topic" | "text" | "document";

const MODES: { id: Mode; label: string; desc: string; icon: typeof Sparkles }[] = [
  { id: "topic", label: "From a topic", desc: "AI writes the notes", icon: Sparkles },
  { id: "text", label: "From pasted text", desc: "Condense your material", icon: Type },
  { id: "document", label: "From a PDF", desc: "Use an uploaded document", icon: FileText },
];

interface Props {
  open: boolean;
  onClose: () => void;
  documents: { id: string; file_name: string | null }[];
}

export default function GenerateNoteDialog({ open, onClose, documents }: Props) {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("topic");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [depth, setDepth] = useState<"concise" | "standard" | "deep">("standard");
  const [text, setText] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setMode("topic");
    setTopic("");
    setSubject("");
    setDepth("standard");
    setText("");
    setDocumentId("");
  }

  function close() {
    if (busy) return;
    reset();
    onClose();
  }

  async function onGenerate(save: boolean) {
    if (busy) return;

    if (mode === "topic" && !topic.trim()) {
      toast.error("Enter a topic first.");
      return;
    }
    if (mode === "text" && text.trim().length < 40) {
      toast.error("Paste at least 40 characters of material.");
      return;
    }
    if (mode === "document" && !documentId) {
      toast.error("Choose a document.");
      return;
    }

    setBusy(true);

    try {
      const res = await fetch("/api/notes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          topic: topic.trim() || undefined,
          subject: subject.trim() || undefined,
          depth,
          text: mode === "text" ? text : undefined,
          documentId: mode === "document" ? documentId : undefined,
          save,
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Generation failed.");
      }

      const note = body.data as GeneratedNote & { id?: string };

      if (save && note.id) {
        toast.success("Note saved.");
        reset();
        onClose();
        router.push(`/dashboard/notes/${note.id}`);
        router.refresh();
        return;
      }

      // Preview path: persist through the server action so activity is logged.
      const created = await createNote({
        title: note.title,
        content: note.content,
        summary: note.summary || null,
        subject: note.subject || subject.trim() || null,
        tags: note.tags,
        source_type: mode === "document" ? "pdf" : "ai",
        document_id: mode === "document" ? documentId : null,
      });

      if (!created.ok || !created.data) {
        throw new Error(created.error ?? "Could not save the note.");
      }

      toast.success("Note saved.");
      reset();
      onClose();
      router.push(`/dashboard/notes/${created.data.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Generate notes with AI"
      description="Pick a source. EduForge writes structured markdown you can edit afterwards."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => onGenerate(true)} loading={busy}>
            <Sparkles className="h-4 w-4" />
            {busy ? "Generating…" : "Generate & save"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-2 sm:grid-cols-3">
          {MODES.map(({ id, label, desc, icon: Icon }) => (
            <button
              key={id}
              type="button"
              disabled={busy}
              onClick={() => setMode(id)}
              className={cn(
                "flex flex-col gap-1 rounded-xl border p-3 text-left transition-all",
                mode === id
                  ? "border-indigo-500/50 bg-indigo-500/10"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20",
                busy && "cursor-not-allowed opacity-60"
              )}
            >
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-white">
                <Icon className="h-3.5 w-3.5 text-indigo-400" />
                {label}
              </span>
              <span className="text-[11px] text-slate-500">{desc}</span>
            </button>
          ))}
        </div>

        {mode === "topic" && (
          <div className="space-y-4">
            <Field label="Topic" hint="Be specific — “Eigenvalues and eigenvectors” beats “Algebra”.">
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Photosynthesis light reactions"
                disabled={busy}
                maxLength={400}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Subject (optional)">
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Biology"
                  disabled={busy}
                />
              </Field>
              <Field label="Depth">
                <Select
                  value={depth}
                  onChange={(e) =>
                    setDepth(e.target.value as "concise" | "standard" | "deep")
                  }
                  disabled={busy}
                >
                  <option value="concise">Concise — ~400 words</option>
                  <option value="standard">Standard — ~900 words</option>
                  <option value="deep">Deep — ~1800 words</option>
                </Select>
              </Field>
            </div>
          </div>
        )}

        {mode === "text" && (
          <div className="space-y-4">
            <Field
              label="Source material"
              hint={`${text.trim().length} characters pasted`}
            >
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste lecture slides, an article, or your rough notes…"
                disabled={busy}
                className="min-h-[200px]"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title hint (optional)">
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Week 4 lecture"
                  disabled={busy}
                />
              </Field>
              <Field label="Subject (optional)">
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Biochemistry"
                  disabled={busy}
                />
              </Field>
            </div>
          </div>
        )}

        {mode === "document" && (
          <div className="space-y-4">
            {documents.length === 0 ? (
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 p-4">
                <NotebookPen className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div className="text-[13px] text-slate-300">
                  <p className="font-medium text-white">No documents yet</p>
                  <p className="mt-1 text-slate-400">
                    Upload a PDF from the AI Tutor page first — it gets chunked and
                    embedded there, then becomes available here.
                  </p>
                </div>
              </div>
            ) : (
              <Field label="Document">
                <Select
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  disabled={busy}
                >
                  <option value="">Select an uploaded document…</option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.file_name ?? "Untitled document"}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <Field label="Subject (optional)">
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Organic Chemistry"
                disabled={busy}
              />
            </Field>
          </div>
        )}
      </div>
    </Modal>
  );
}
