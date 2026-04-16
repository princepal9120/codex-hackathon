import { Badge } from "@/components/ui/Badge";
import SurfaceCard from "@/components/SurfaceCard";
import { type TaskRecord } from "@/components/task-api";

interface PromptPreviewPanelProps {
  task: TaskRecord;
}

export default function PromptPreviewPanel({ task }: PromptPreviewPanelProps) {
  if (!task.promptPreview) {
    return null;
  }

  return (
    <SurfaceCard
      eyebrow="Review artifact"
      title="Prompt & context preview"
      description="Inspect the exact context bundle and prompt shape used to generate the patch preview."
      action={<Badge variant="secondary">Context locked</Badge>}
      bodyClassName="p-0"
    >
      <div className="border-b border-[#d9ece7] bg-[#edf8f6] px-6 py-4 text-sm text-[#276c66] sm:px-7">
        <p className="font-medium text-[#1f1c17]">Why these files were selected</p>
        <p className="mt-1 leading-6 text-[#4c756f]">{task.contextSummary || "CodexFlow assembled a repo-aware context bundle for this run."}</p>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words bg-[#fbfaf7] px-6 py-6 text-xs leading-7 text-[#4f473d] sm:px-7">
        <code>{task.promptPreview}</code>
      </pre>
    </SurfaceCard>
  );
}
