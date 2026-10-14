import type { LucideIcon } from "lucide-react";
import {
  NotebookPen,
  Layers,
  HelpCircle,
  CheckCircle2,
  MessageSquare,
  Trophy,
  User,
} from "lucide-react";
import type { ActivityType } from "@/lib/study/types";

/** Icon per activity type — pairs with ACTIVITY_META colours. */
export const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
  note: NotebookPen,
  flashcard: Layers,
  quiz: HelpCircle,
  task: CheckCircle2,
  tutor: MessageSquare,
  scholarship: Trophy,
  profile: User,
};
