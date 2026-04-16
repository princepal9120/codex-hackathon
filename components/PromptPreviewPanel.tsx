'use client';

import type { TaskRecord } from "@/components/task-api";

interface PromptPreviewPanelProps {
  task: TaskRecord;
}

export default function PromptPreviewPanel({ task }: PromptPreviewPanelProps) {
  const preview = task.promptPreview || task.prompt;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-900/5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-600">
        Context
      </p>
      <h3 className="mt-2 text-lg font-bold text-gray-900">Prompt preview</h3>
      <p className="mt-1 text-sm text-gray-500">
        The exact prompt sent to the model, visible for audit.
      </p>

      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <pre className="overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-6 text-gray-700">
          {preview || "Prompt preview will appear after the task generates context."}
        </pre>
      </div>

      {task.contextSummary && (
        <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-500">
            Context summary
          </p>
          <p className="mt-1 text-sm leading-6 text-gray-700">{task.contextSummary}</p>
        </div>
      )}
    </section>
  );
}
