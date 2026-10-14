"use client";

import { motion } from "framer-motion";
import { ease } from "@/lib/motion";
import { relativeTime } from "@/components/ui/Badge";
import { ACTIVITY_META } from "@/lib/study/types";
import { ACTIVITY_ICONS } from "@/lib/study/activity-icons";
import type { RecentActivityItem } from "@/lib/study/activity";
import { useLanguage } from "@/components/i18n/LanguageProvider";

interface RecentActivityProps {
  activity: RecentActivityItem[];
}

export default function RecentActivity({ activity }: RecentActivityProps) {
  const { t } = useLanguage();
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
        {t("recentActivity")}
      </h2>

      {activity.length === 0 ? (
        <p className="py-10 text-center text-[13px] leading-relaxed text-slate-500">
          {t("nothingYet")}
        </p>
      ) : (
        <div className="space-y-3">
          {activity.map((item, i) => {
            const meta = ACTIVITY_META[item.activity_type];
            const Icon = ACTIVITY_ICONS[item.activity_type];

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.15 + i * 0.05, ease }}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03]"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta?.className ?? "text-slate-400 bg-white/[0.06]"}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-slate-200">{item.label}</p>
                  <p className="text-[11px] text-slate-500">
                    {relativeTime(item.created_at)}
                    {item.xp > 0 ? ` · +${item.xp} XP` : ""}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
