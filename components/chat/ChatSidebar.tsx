"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquarePlus, MessageSquare, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { startChat, deleteChat } from "@/app/dashboard/tutor/actions";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export interface ChatListItem {
  id: string;
  title: string;
}

interface ChatSidebarProps {
  chats: ChatListItem[];
  activeId?: string;
}

export default function ChatSidebar({ chats, activeId }: ChatSidebarProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<string | null>(null);

  function newChat() {
    startTransition(async () => {
      const res = await startChat();
      if (!res.ok || !res.data) {
        toast.error(res.error ?? "Could not start a chat.");
        return;
      }
      router.push(`/dashboard/tutor/${res.data.id}`);
    });
  }

  function remove(id: string) {
    setConfirming(null);
    startTransition(async () => {
      const res = await deleteChat(id);
      if (!res.ok) {
        toast.error(res.error ?? "Could not delete the chat.");
        return;
      }
      toast.success("Chat deleted.");
      if (id === activeId) router.push("/dashboard/tutor");
      else router.refresh();
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#080c19] p-4">
      <button
        type="button"
        onClick={newChat}
        disabled={pending}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MessageSquarePlus className="h-4 w-4" />
        )}
        {t("newChat")}
      </button>

      <div className="-mr-1 flex-1 space-y-1 overflow-y-auto pr-1">
        {chats.length === 0 ? (
          <p className="px-2 py-6 text-center text-[13px] text-slate-500">
            {t("noConversations")}
          </p>
        ) : (
          chats.map((chat) => {
            const isActive = chat.id === activeId;

            return (
              <div
                key={chat.id}
                className={cn(
                  "group flex items-center gap-1 rounded-xl transition-colors",
                  isActive
                    ? "bg-indigo-500/15 ring-1 ring-indigo-500/30"
                    : "hover:bg-white/[0.04]"
                )}
              >
                <Link
                  href={`/dashboard/tutor/${chat.id}`}
                  className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5"
                >
                  <MessageSquare
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-indigo-300" : "text-slate-500"
                    )}
                  />
                  <span
                    className={cn(
                      "truncate text-[13px]",
                      isActive ? "text-white" : "text-slate-300"
                    )}
                  >
                    {chat.title}
                  </span>
                </Link>

                {confirming === chat.id ? (
                  <span className="flex shrink-0 items-center gap-1 pr-2">
                    <button
                      type="button"
                      onClick={() => remove(chat.id)}
                      disabled={pending}
                      className="rounded-md bg-rose-500/20 px-2 py-1 text-[11px] font-medium text-rose-300 transition-colors hover:bg-rose-500/30"
                    >
                      {t("delete")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(null)}
                      className="rounded-md px-2 py-1 text-[11px] text-slate-400 transition-colors hover:text-white"
                    >
                      {t("cancel")}
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(chat.id)}
                    aria-label={`Delete "${chat.title}"`}
                    className="mr-2 shrink-0 rounded-md p-1 text-slate-600 opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-400 focus:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
