"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Save } from "lucide-react";
import Button from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Badge";
import { Field, Input } from "@/components/ui/Field";
import { savePreferences } from "@/app/dashboard/settings/actions";
import { fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { SettingsData } from "./SettingsClient";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const GOAL_CHIPS = [15, 30, 60, 90, 120];

interface Props {
  settings: SettingsData;
  onDirtyChange: (dirty: boolean) => void;
}

export default function PreferencesSection({ settings, onDirtyChange }: Props) {
  const { t } = useLanguage();
  const [baseline, setBaseline] = useState({
    daily_goal_minutes: settings.daily_goal_minutes,
  });
  const [goalInput, setGoalInput] = useState(String(settings.daily_goal_minutes));
  const [saving, setSaving] = useState(false);

  const goalMinutes = Number(goalInput);
  const dirty = goalMinutes !== baseline.daily_goal_minutes;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty || saving) return;

    if (!Number.isFinite(goalMinutes) || goalMinutes < 5 || goalMinutes > 600) {
      toast.error("Daily goal must be between 5 and 600 minutes.");
      return;
    }

    setSaving(true);
    try {
      const res = await savePreferences({
        daily_goal_minutes: goalMinutes,
      });
      if (!res.ok) throw new Error(res.error ?? "Could not save your preferences.");

      setBaseline({ daily_goal_minutes: goalMinutes });
      setGoalInput(String(goalMinutes));
      toast.success("Preferences saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save your preferences."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp}>
        <Card>
          <CardTitle>{t("studyPreferences")}</CardTitle>

          <form onSubmit={onSave} className="space-y-4">
            <Field
              label={t("dailyGoal")}
              hint={t("dailyGoalHint")}
            >
              <Input
                type="number"
                min={5}
                max={600}
                step={5}
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                disabled={saving}
                className="max-w-[160px]"
              />
            </Field>

            <div className="flex flex-wrap gap-1.5">
              {GOAL_CHIPS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setGoalInput(String(minutes))}
                  disabled={saving}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all",
                    goalMinutes === minutes
                      ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-200"
                      : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white"
                  )}
                >
                  {minutes} min
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] pt-4">
              {dirty && (
                <span className="mr-auto text-[12px] text-amber-300">
                  {t("unsaved")}
                </span>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setGoalInput(String(baseline.daily_goal_minutes));
                }}
                disabled={!dirty || saving}
              >
                {t("reset")}
              </Button>
              <Button type="submit" disabled={!dirty} loading={saving}>
                <Save className="h-4 w-4" />
                {t("savePreferences")}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </motion.div>
  );
}
