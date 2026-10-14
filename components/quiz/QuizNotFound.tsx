import Link from "next/link";
import { HelpCircle } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

export default function QuizNotFound({
  title = "Quiz not found",
  description = "This quiz does not exist, or it belongs to another account.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl">
        <EmptyState
          icon={HelpCircle}
          title={title}
          description={description}
          action={
            <Link
              href="/dashboard/quiz"
              className={cn(
                "btn-gradient inline-flex h-10 items-center gap-2 rounded-xl px-4",
                "text-sm font-medium text-white shadow-lg shadow-indigo-500/20",
                "transition-all hover:brightness-110"
              )}
            >
              Back to quizzes
            </Link>
          }
        />
      </div>
    </DashboardShell>
  );
}
