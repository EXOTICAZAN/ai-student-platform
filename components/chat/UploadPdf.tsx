"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Paperclip } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

interface Props {
  chatId: string;
}

export default function UploadPdf({ chatId }: Props) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);

  async function uploadFile(file: File) {
    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("file", file);
      formData.append("chatId", chatId);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      toast.success(t("pdfReady"));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Upload failed"
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];

          // Clearing the value means picking the same file again still fires onChange.
          e.target.value = "";

          if (!file) return;

          uploadFile(file);
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Paperclip className="h-4 w-4" />
        {uploading ? t("uploading") : t("uploadPdf")}
      </button>
    </>
  );
}