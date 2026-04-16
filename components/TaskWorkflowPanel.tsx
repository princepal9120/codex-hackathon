'use client';

import { CheckCircle2, CircleDashed, FileSearch, Code2, ShieldCheck, Loader2 } from "lucide-react";
import type { TaskRecord } from "@/components/task-api";

interface TaskWorkflowPanelProps {
  task: TaskRecord;
}

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
  // Terminal states
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
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-900/5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-600">
        Pipeline
      </p>
      <h3 className="mt-2 text-lg font-bold text-gray-900">Execution workflow</h3>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => {
          const status = getStepStatus(task, step.key);
          const Icon = step.icon;

          const statusStyles = {
            done: "border-green-200 bg-green-50",
            active: "border-blue-200 bg-blue-50",
            failed: "border-red-200 bg-red-50",
            pending: "border-gray-200 bg-gray-50",
            skipped: "border-gray-200 bg-gray-50 opacity-60",
          };

          const iconColors = {
            done: "text-green-600",
            active: "text-blue-600",
            failed: "text-red-600",
            pending: "text-gray-400",
            skipped: "text-gray-300",
          };

          return (
            <div key={step.key} className={`rounded-xl border p-4 transition-all ${statusStyles[status]}`}>
              <div className="flex items-center justify-between">
                <Icon className={`h-5 w-5 ${iconColors[status]}`} />
                {status === "done" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {status === "active" && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                {status === "failed" && <span className="text-[10px] font-semibold text-red-600">FAIL</span>}
                {status === "pending" && <CircleDashed className="h-4 w-4 text-gray-300" />}
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-900">{step.label}</p>
              <p className="mt-0.5 text-xs text-gray-500">{step.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
