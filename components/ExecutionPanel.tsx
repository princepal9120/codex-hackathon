'use client';

import type { TaskRecord } from "@/components/task-api";

interface ExecutionPanelProps { task: TaskRecord; }

export default function ExecutionPanel({ task }: ExecutionPanelProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-6 shadow-md">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Output</p>
      <h3 className="mt-2 text-lg font-bold text-foreground">Execution logs</h3>
      <p className="mt-1 text-sm text-muted-foreground">Raw execution output and metadata.</p>

      {task.errorMessage && (
        <div className="mt-4 rounded-[var(--radius)] border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-red-500">Error</p>
          <p className="mt-1 text-sm text-red-700">{task.errorMessage}</p>
        </div>
      )}

      <div className="mt-4 rounded-[var(--radius)] border border-border bg-gray-950 p-4">
        <pre className="overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-gray-400">{task.logs?.trim() || "No execution logs available."}</pre>
      </div>
    </section>
  );
}
