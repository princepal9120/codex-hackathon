'use client';

import type { TaskRecord } from "@/components/task-api";

interface PromptPreviewPanelProps { task: TaskRecord; }

export default function PromptPreviewPanel({ task }: PromptPreviewPanelProps) {
  const preview = task.promptPreview || task.prompt;

  return (
    <section className="rounded-lg border border-border bg-card p-6 shadow-md">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Context</p>
      <h3 className="mt-2 text-lg font-bold text-foreground">Prompt preview</h3>
      <p className="mt-1 text-sm text-muted-foreground">The exact prompt sent to the model, visible for audit.</p>

      <div className="mt-4 rounded-[var(--radius)] border border-border bg-muted p-4">
        <pre className="overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-6 text-foreground">{preview || "Prompt preview will appear after the task generates context."}</pre>
      </div>

      {task.contextSummary && (
        <div className="mt-4 rounded-[var(--radius)] border border-primary/20 bg-secondary px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Context summary</p>
          <p className="mt-1 text-sm leading-6 text-foreground">{task.contextSummary}</p>
        </div>
      )}
    </section>
  );
}
