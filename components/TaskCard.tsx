import Link from "next/link";
import { CheckCircle2, Clock3, Files, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  formatTaskTimestamp,
  getConfidenceLabel,
  getTaskIdentifier,
  type TaskRecord,
} from "@/components/task-api";

interface TaskCardProps {
  task: TaskRecord;
}

export default function TaskCard({ task }: TaskCardProps) {


  const verificationLabel =
    task.lintStatus === "failed" || task.testStatus === "failed"
      ? "Verify failed"
      : task.lintStatus === "passed" && task.testStatus === "passed"
        ? "Verified"
        : "Pending";

  const VerificationIcon =
    task.lintStatus === "failed" || task.testStatus === "failed"
      ? ShieldAlert
      : task.lintStatus === "passed" && task.testStatus === "passed"
        ? CheckCircle2
        : Clock3;

  return (
    <Link href={`/tasks/${task.id}`} className="group block">
      <article className="rounded-lg border border-border bg-card p-4 shadow-xs transition-all duration-150 hover:shadow-md hover:border-ring/30 group-focus-visible:ring-2 group-focus-visible:ring-ring/40 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background">
        {/* Header: ID + Score */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {getTaskIdentifier(task.id)}
            </p>
            <h3 className="mt-1.5 text-[14px] font-semibold leading-5 text-foreground line-clamp-2">
              {task.title}
            </h3>
          </div>
          {task.score !== null && (
            <span className="shrink-0 rounded-[var(--radius)] bg-secondary px-2 py-0.5 text-[11px] font-semibold tabular-nums text-secondary-foreground">
              {task.score}
            </span>
          )}
        </div>

        {/* Prompt preview */}
        <p className="mt-2 line-clamp-2 text-[12px] leading-[18px] text-muted-foreground">
          {task.contextSummary || task.prompt}
        </p>

        {/* Meta row */}
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          {task.selectedFiles.length > 0 && (
            <>
              <span className="inline-flex items-center gap-1">
                <Files className="h-3 w-3" />
                {task.selectedFiles.length}
              </span>
              <span className="text-border">·</span>
            </>
          )}
          <span className="inline-flex items-center gap-1">
            <VerificationIcon className="h-3 w-3" />
            {verificationLabel}
          </span>
        </div>

        {/* Footer: Confidence + Updated */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-3 border-t border-border">
          <span className="text-[11px] font-medium text-foreground">
            {getConfidenceLabel(task.score)}
          </span>
          <div className="flex items-center gap-2">
            <span className={cn("inline-flex h-1.5 w-1.5 rounded-full", task.status === "running" ? "bg-blue-500 status-pulse" : task.status === "passed" ? "bg-green-500" : task.status === "failed" ? "bg-red-500" : task.status === "needs_review" ? "bg-amber-500" : "bg-muted-foreground")} />
            <span className="text-[11px] text-muted-foreground">
              {formatTaskTimestamp(task.updatedAt)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
