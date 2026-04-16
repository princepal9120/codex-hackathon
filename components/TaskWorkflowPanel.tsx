import { CheckCircle2, Clock3, Loader, XCircle } from "lucide-react";

import SurfaceCard from "@/components/SurfaceCard";
import { type TaskRecord, type TaskStatus } from "@/components/task-api";

interface TaskWorkflowPanelProps {
  task: TaskRecord;
}

const stages: Array<{ key: TaskStatus; label: string; helper: string }> = [
  { key: "queued", label: "Queued", helper: "Task captured with repository path and verification commands." },
  { key: "running", label: "Running", helper: "Repository scan, context assembly, and execution are in motion." },
  { key: "needs_review", label: "Needs review", helper: "Patch preview is ready, but a human should inspect trust signals." },
  { key: "passed", label: "Passed", helper: "Verification cleared and the review artifact stayed consistent." },
  { key: "failed", label: "Failed", helper: "Execution or verification failed before the run could be trusted." },
];

const stageOrder: Record<TaskStatus, number> = {
  queued: 0,
  running: 1,
  needs_review: 2,
  passed: 3,
  failed: 3,
};

function getStageState(taskStatus: TaskStatus, stageKey: TaskStatus) {
  const current = stageOrder[taskStatus];
  const stage = stageOrder[stageKey];

  if (taskStatus === "failed") {
    if (stageKey === "failed") return "current";
    return stage < current ? "complete" : "upcoming";
  }

  if (stageKey === taskStatus) return "current";
  return stage < current ? "complete" : "upcoming";
}

export default function TaskWorkflowPanel({ task }: TaskWorkflowPanelProps) {
  return (
    <SurfaceCard eyebrow="Lifecycle" title="Execution workflow" description="Follow the exact lifecycle that produced the current review state.">
      <div className="space-y-4">
        {stages.map((stage) => {
          const state = getStageState(task.status, stage.key);
          const isCurrent = state === "current";
          const isComplete = state === "complete";
          const tone =
            stage.key === "failed" && isCurrent
              ? "border-[#ecd3d1] bg-[#fbefee]"
              : isCurrent
                ? "border-[#cfe7e4] bg-[#edf8f6]"
                : isComplete
                  ? "border-[#d5ead8] bg-[#eef8f0]"
                  : "border-[#e8e0d4] bg-[#faf6f0]";

          return (
            <div key={stage.key} className={`rounded-[22px] border px-4 py-4 ${tone}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {stage.key === "failed" && isCurrent ? (
                    <XCircle className="h-5 w-5 text-[#b65858]" />
                  ) : isCurrent ? (
                    <Loader className="h-5 w-5 animate-spin text-[#0f766e]" />
                  ) : isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-[#277a46]" />
                  ) : (
                    <Clock3 className="h-5 w-5 text-[#8a8176]" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1f1c17]">{stage.label}</p>
                  <p className="mt-1 text-sm leading-6 text-[#6f675d]">{stage.helper}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SurfaceCard>
  );
}
