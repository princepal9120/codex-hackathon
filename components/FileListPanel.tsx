import { Badge } from "@/components/ui/Badge";
import SurfaceCard from "@/components/SurfaceCard";
import { type TaskRecord } from "@/components/task-api";

interface FileListPanelProps {
  task: TaskRecord;
}

export default function FileListPanel({ task }: FileListPanelProps) {
  return (
    <SurfaceCard eyebrow="Context" title="Selected files" description="These files formed the repo slice used to build the prompt preview.">
      {task.selectedFiles.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-[#e6ded3] bg-[#faf6f0] px-5 py-8 text-sm text-[#7b7267]">
          No file selection has been recorded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {task.selectedFiles.map((file) => (
            <div key={file.path} className="rounded-[22px] border border-[#e8e0d4] bg-white px-4 py-4 shadow-[0_8px_20px_rgba(31,24,18,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <span className="break-all font-mono text-sm text-[#1f1c17]">{file.path}</span>
                {file.score !== null ? <Badge variant="secondary">{file.score}%</Badge> : null}
              </div>
              {file.rationale ? <p className="mt-3 text-sm leading-6 text-[#6f675d]">{file.rationale}</p> : null}
              {file.matchedTerms && file.matchedTerms.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {file.matchedTerms.map((term) => (
                    <span key={`${file.path}-${term}`} className="rounded-full border border-[#cfe7e4] bg-[#edf8f6] px-2.5 py-1 text-[11px] font-medium text-[#276c66]">
                      {term}
                    </span>
                  ))}
                </div>
              ) : null}
              {file.excerpt ? (
                <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-[18px] bg-[#fbfaf7] p-3 text-xs leading-6 text-[#4f473d]">
                  {file.excerpt}
                </pre>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </SurfaceCard>
  );
}
