"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Loader2, BellOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/components/ui/Badge";

interface Notification {
  id: string;
  text: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export default function NotificationsBell() {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) throw new Error("failed");

      const json = (await res.json()) as {
        data: { notifications: Notification[]; unread: number } | null;
      };

      if (!json.data) throw new Error("failed");

      setItems(json.data.notifications);
      setUnread(json.data.unread);
    } catch {
      // A silent failure here is fine — the bell just stays empty.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/notifications", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("failed"))))
      .then((json: { data: { notifications: Notification[]; unread: number } | null }) => {
        if (cancelled || !json.data) return;
        setItems(json.data.notifications);
        setUnread(json.data.unread);
      })
      .catch(() => {
        // A silent failure here is fine — the bell just stays empty.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);

    if (next) {
      await load();
      if (unread === 0) return;

      // Opening the panel counts as reading it.
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        toast.error("Could not mark notifications as read.");
        return;
      }

      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    }
  }

  function openNotification(n: Notification) {
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={toggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
        aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#0c1224] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <p className="text-sm font-semibold text-white">Notifications</p>
              {unread > 0 && (
                <span className="text-[11px] text-slate-500">{unread} unread</span>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <BellOff className="h-5 w-5 text-slate-600" />
                <p className="text-[13px] text-slate-500">Nothing new right now.</p>
              </div>
            ) : (
              <ul className="max-h-72 overflow-y-auto">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openNotification(n)}
                      disabled={!n.link}
                      className={cn(
                        "w-full border-b border-white/[0.04] px-4 py-3 text-left transition-colors last:border-b-0",
                        !n.read && "bg-indigo-500/5",
                        n.link ? "hover:bg-white/[0.03]" : "cursor-default"
                      )}
                    >
                      <p className="text-[13px] text-slate-200">{n.text}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {relativeTime(n.created_at)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
