'use client';

import { CheckCircle2, CircleDashed, FileSearch, Code2, ShieldCheck, Loader2 } from "lucide-react";
import type { TaskRecord } from "@/components/task-api";

interface TaskWorkflowPanelProps { task: TaskRecord; }

const steps = [
  { key: "context", label: "Select context", icon: FileSearch, desc: "Scan and rank files" },
  { key: "prompt", label: "Build prompt", icon: Code2, desc: "Generate model input" },
  { key: "patch", label: "Generate patch", icon: Code2, desc: "Produce diff preview" },
  { key: "verify", label: "Verify output", icon: ShieldCheck, desc: "Run lint & tests" },
];

function getStepStatus(task: TaskRecord, key: string) {
  if (task.status === "queued") return "pending";
  if (task.status === "running") {
    if (key === "context" && task.selectedFiles.length > 0) return "done";
    if (key === "context") return "active";
    if (key === "prompt" && task.promptPreview) return "done";
    if (key === "prompt" && task.selectedFiles.length > 0) return "active";
    return "pending";
  }
  if (key === "context") return task.selectedFiles.length > 0 ? "done" : "skipped";
  if (key === "prompt") return task.promptPreview ? "done" : "skipped";
  if (key === "patch") return task.diff?.trim() ? "done" : "skipped";
  if (key === "verify") {
    if (task.lintStatus === "passed" && task.testStatus === "passed") return "done";
    if (task.lintStatus === "failed" || task.testStatus === "failed") return "failed";
    return "skipped";
  }
  return "pending";
}

export default function TaskWorkflowPanel({ task }: TaskWorkflowPanelProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-6 shadow-md">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Pipeline</p>
      <h3 className="mt-2 text-lg font-bold text-foreground">Execution workflow</h3>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => {
          const status = getStepStatus(task, step.key);
          const Icon = step.icon;
          const styles = {
            done: "border-green-200 bg-green-50",
            active: "border-blue-200 bg-blue-50",
            failed: "border-red-200 bg-red-50",
            pending: "border-border bg-muted",
            skipped: "border-border bg-muted opacity-60",
          };
          const iconC = {
            done: "text-green-600",
            active: "text-blue-600",
            failed: "text-red-600",
            pending: "text-muted-foreground",
            skipped: "text-muted-foreground/50",
          };

          return (
            <div key={step.key} className={`rounded-[var(--radius)] border p-4 transition-all ${styles[status]}`}>
              <div className="flex items-center justify-between">
                <Icon className={`h-5 w-5 ${iconC[status]}`} />
                {status === "done" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {status === "active" && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                {status === "failed" && <span className="text-[10px] font-semibold text-red-600">FAIL</span>}
                {status === "pending" && <CircleDashed className="h-4 w-4 text-muted-foreground" />}
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">{step.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{step.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
