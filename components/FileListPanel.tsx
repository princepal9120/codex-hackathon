'use client';

import type { TaskRecord } from "@/components/task-api";

interface FileListPanelProps {
  task: TaskRecord;
}

export default function FileListPanel({ task }: FileListPanelProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-900/5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-600">
        Repo context
      </p>
      <h3 className="mt-2 text-lg font-bold text-gray-900">Selected files</h3>
      <p className="mt-1 text-sm text-gray-500">
        {task.selectedFiles.length} files ranked for prompt context.
      </p>

      {task.selectedFiles.length > 0 ? (
        <div className="mt-4 space-y-2">
          {task.selectedFiles.map((file, i) => (
            <div
              key={file.path}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-colors hover:border-violet-200 hover:bg-violet-50/30"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-100 text-[10px] font-bold text-violet-600">
                    {i + 1}
                  </span>
                  <p className="truncate font-mono text-xs font-medium text-gray-800">{file.path}</p>
                </div>
                {file.score !== null && (
                  <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                    {file.score}
                  </span>
                )}
              </div>
              {file.rationale && (
                <p className="mt-2 text-xs leading-5 text-gray-500">{file.rationale}</p>
              )}
              {file.matchedTerms && file.matchedTerms.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {file.matchedTerms.map((term) => (
                    <span key={term} className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600">
                      {term}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
          No files selected. File ranking will populate after the task runs.
        </div>
      )}
    </section>
  );
}
