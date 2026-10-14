"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import type { FlashcardRow } from "@/lib/study/types";

const COUNTS = [4, 8, 12, 16, 20];

interface Props {
  open: boolean;
  onClose: () => void;
  deckId: string;
  deckTitle: string;
  onGenerated: (cards: FlashcardRow[]) => void;
}

export default function GenerateCardsDialog({
  open,
  onClose,
  deckId,
  deckTitle,
  onGenerated,
}: Props) {
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(8);
  const [busy, setBusy] = useState(false);

  function close() {
    if (busy) return;
    setTopic("");
    setCount(8);
    onClose();
  }

  async function onGenerate() {
    if (busy) return;

    setBusy(true);

    try {
      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deckId,
          topic: topic.trim() || deckTitle,
          count,
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Generation failed.");
      }

      const cards = (body.data?.cards ?? []) as FlashcardRow[];

      toast.success(`Added ${cards.length} new cards.`);
      onGenerated(cards);
      setTopic("");
      setCount(8);
      onClose();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Generation failed."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Generate more cards"
      description={`New cards are added to “${deckTitle}”.`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onGenerate} loading={busy}>
            <Sparkles className="h-4 w-4" />
            {busy ? "Generating…" : "Generate cards"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field
          label="Focus (optional)"
          hint="Narrow the AI down to a subtopic. Defaults to the deck title."
        >
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={deckTitle}
            disabled={busy}
            maxLength={400}
          />
        </Field>
        <Field label="Number of cards">
          <Select
            value={String(count)}
            onChange={(e) => setCount(Number(e.target.value))}
            disabled={busy}
          >
            {COUNTS.map((n) => (
              <option key={n} value={n}>
                {n} cards
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
