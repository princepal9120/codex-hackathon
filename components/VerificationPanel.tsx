'use client';

import { CheckCircle2, XCircle, CircleDashed } from "lucide-react";
import type { TaskRecord } from "@/components/task-api";

interface VerificationPanelProps { task: TaskRecord; }

export default function VerificationPanel({ task }: VerificationPanelProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-6 shadow-md">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Verification</p>
      <h3 className="mt-2 text-lg font-bold text-foreground">Trust evidence</h3>
      <p className="mt-1 text-sm text-muted-foreground">Lint, test, and verification results for this run.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <CheckRow label="Lint" status={task.lintStatus} />
        <CheckRow label="Tests" status={task.testStatus} />
      </div>

      {task.verificationNotes && (
        <div className="mt-4 rounded-[var(--radius)] border border-border bg-muted px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Notes</p>
          <p className="mt-1 text-sm leading-6 text-foreground">{task.verificationNotes}</p>
        </div>
      )}

      {(task.lintOutput || task.testOutput) && (
        <div className="mt-4 space-y-3">
          {task.lintOutput && <LogBlock title="Lint output" body={task.lintOutput} />}
          {task.testOutput && <LogBlock title="Test output" body={task.testOutput} />}
        </div>
      )}
    </section>
  );
}

function CheckRow({ label, status }: { label: string; status: string }) {
  const Icon = status === "passed" ? CheckCircle2 : status === "failed" ? XCircle : CircleDashed;
  const colors = {
    passed: "text-green-600 bg-green-50 border-green-200",
    failed: "text-red-600 bg-red-50 border-red-200",
    pending: "text-muted-foreground bg-muted border-border",
  };
  const style = colors[status as keyof typeof colors] ?? colors.pending;
  return (
    <div className={`flex items-center justify-between rounded-[var(--radius)] border px-4 py-3 ${style}`}>
      <span className="text-sm font-semibold">{label}</span>
      <span className="flex items-center gap-1.5 text-sm font-semibold">
        <Icon className="h-4 w-4" />
        {status === "passed" ? "Passed" : status === "failed" ? "Failed" : "Pending"}
      </span>
    </div>
  );
}

function LogBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-muted p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
      <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 text-foreground">{body.trim() || "No output"}</pre>
    </div>
  );
}
