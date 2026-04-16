import Link from "next/link";
import { CheckCircle2, Clock3, Files, FolderGit2, ShieldAlert, Sparkles } from "lucide-react";

import {
  formatTaskTimestamp,
  getConfidenceLabel,
  getTaskIdentifier,
  type TaskRecord,
} from "@/components/task-api";

interface TaskCardProps {
  task: TaskRecord;
}

const statusPillStyles: Record<TaskRecord["status"], string> = {
  queued: "bg-[#f2efe9] text-[#7b7367]",
  running: "bg-[#f7edd0] text-[#a26b06]",
  passed: "bg-[#e6f3ea] text-[#277a46]",
  failed: "bg-[#f8e7e6] text-[#a54646]",
  needs_review: "bg-[#eee6fb] text-[#7b4fc9]",
};

export default function TaskCard({ task }: TaskCardProps) {
  const verificationCopy =
    task.lintStatus === "failed" || task.testStatus === "failed"
      ? "Verification failed"
      : task.lintStatus === "passed" && task.testStatus === "passed"
        ? "Verification passed"
        : "Verification pending";

  const verificationIcon =
    task.lintStatus === "failed" || task.testStatus === "failed" ? (
      <ShieldAlert className="h-3.5 w-3.5" />
    ) : task.lintStatus === "passed" && task.testStatus === "passed" ? (
      <CheckCircle2 className="h-3.5 w-3.5" />
    ) : (
      <Clock3 className="h-3.5 w-3.5" />
    );

  return (
    <Link href={`/tasks/${task.id}`}>
      <article className="rounded-[18px] border border-[#e7e2d9] bg-white p-4 shadow-[0_8px_20px_rgba(26,22,17,0.05)] transition-all hover:-translate-y-0.5 hover:border-[#d9d2c8] hover:shadow-[0_14px_28px_rgba(26,22,17,0.08)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9a958c]">{getTaskIdentifier(task.id)}</p>
            <h3 className="mt-2 text-[15px] font-semibold leading-5 text-[#27241f]">{task.title}</h3>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusPillStyles[task.status]}`}>
            {task.score ?? "—"}
          </span>
        </div>

        <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-[#8b857c]">{task.contextSummary || task.prompt}</p>

        <div className="mt-4 flex items-center gap-2 text-[11px] text-[#7c766d]">
          <span className="inline-flex items-center gap-1">
            <FolderGit2 className="h-3.5 w-3.5" />
            {task.repoPath || "."}
          </span>
          <span className="text-[#cac2b8]">•</span>
          <span className="inline-flex items-center gap-1">
            <Files className="h-3.5 w-3.5" />
            {task.selectedFiles.length} files
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f5efe4] text-[#8b6d3f]">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-[#4d483f]">{getConfidenceLabel(task.score)}</p>
              <p className="truncate text-[11px] text-[#908980]">Updated {formatTaskTimestamp(task.updatedAt)}</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-[#f7f3ec] px-2.5 py-1 text-[10px] font-medium text-[#756d61]">
            {verificationIcon}
            {verificationCopy}
          </div>
        </div>
      </article>
    </Link>
  );
}
