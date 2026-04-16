'use client';

import type { TaskRecord } from "@/components/task-api";

interface FileListPanelProps { task: TaskRecord; }

export default function FileListPanel({ task }: FileListPanelProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-6 shadow-md">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Repo context</p>
      <h3 className="mt-2 text-lg font-bold text-foreground">Selected files</h3>
      <p className="mt-1 text-sm text-muted-foreground">{task.selectedFiles.length} files ranked for prompt context.</p>

      {task.selectedFiles.length > 0 ? (
        <div className="mt-4 space-y-2">
          {task.selectedFiles.map((file, i) => (
            <div key={file.path} className="rounded-[var(--radius)] border border-border bg-muted px-4 py-3 transition-colors hover:border-primary/30 hover:bg-secondary">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent text-[10px] font-bold text-accent-foreground">{i + 1}</span>
                  <p className="truncate font-mono text-xs font-medium text-foreground">{file.path}</p>
                </div>
                {file.score !== null && <span className="shrink-0 rounded-[var(--radius)] bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">{file.score}</span>}
              </div>
              {file.rationale && <p className="mt-2 text-xs leading-5 text-muted-foreground">{file.rationale}</p>}
              {file.matchedTerms && file.matchedTerms.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {file.matchedTerms.map((term) => <span key={term} className="rounded-[var(--radius)] bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">{term}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[var(--radius)] border border-dashed border-border bg-muted px-4 py-8 text-center text-sm text-muted-foreground">No files selected. File ranking will populate after the task runs.</div>
      )}
    </section>
  );
}
