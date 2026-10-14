"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SaveButtonProps {
  scholarshipId: string;
  initialSaved: boolean;
  className?: string;
  showLabel?: boolean;
  onToggle?: (saved: boolean) => void;
}

export default function SaveButton({
  scholarshipId,
  initialSaved,
  className,
  showLabel = false,
  onToggle,
}: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    const optimistic = !saved;
    setSaved(optimistic); // Optimistic update

    try {
      const res = await fetch(`/api/scholarships/${scholarshipId}/save`, {
        method: optimistic ? "POST" : "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? "Failed to update");
      }

      onToggle?.(optimistic);
      toast.success(optimistic ? "Scholarship saved" : "Removed from saved");
    } catch (err) {
      setSaved(!optimistic); // Revert on failure
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? "Remove from saved" : "Save scholarship"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200",
        "hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed",
        saved
          ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25"
          : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white",
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : saved ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      {showLabel && (saved ? "Saved" : "Save")}
    </button>
  );
}
