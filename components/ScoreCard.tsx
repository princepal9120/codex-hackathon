import SurfaceCard from "@/components/SurfaceCard";
import { getConfidenceLabel, type TaskRecord } from "@/components/task-api";

interface ScoreCardProps {
  task: TaskRecord;
}

export default function ScoreCard({ task }: ScoreCardProps) {
  if (task.score === null && (task.status === "queued" || task.status === "running")) {
    return null;
  }

  const score = task.score ?? 0;
  const barWidth = Math.max(6, Math.min(100, score));
  const tone = score >= 80 ? "bg-[#277a46]" : score >= 60 ? "bg-[#c7932b]" : "bg-[#c96e6e]";

  return (
    <SurfaceCard eyebrow="Score" title="Confidence snapshot" description="A compact signal combining verification and run outcome into one quick read.">
      <div className="flex items-end gap-3">
        <span className="text-5xl font-semibold tracking-[-0.06em] text-[#1f1c17]">{task.score ?? "—"}</span>
        <span className="pb-2 text-sm text-[#7f766a]">/100</span>
      </div>
      <div className="mt-4 h-2 rounded-full bg-[#ece5da]">
        <div className={`h-2 rounded-full ${tone}`} style={{ width: `${barWidth}%` }} />
      </div>
      <p className="mt-4 text-sm leading-6 text-[#6f675d]">
        {task.status === "passed"
          ? "Verification cleared and the patch preview looks consistent."
          : task.status === "failed"
            ? "Execution failed before CodexFlow could produce a trustworthy result."
            : task.status === "needs_review"
              ? "The review artifact exists, but a human still needs to make the trust decision."
              : "CodexFlow is still moving through the execution pipeline."}
      </p>
      <p className="mt-2 text-sm font-medium text-[#1f1c17]">{getConfidenceLabel(task.score)}</p>
    </SurfaceCard>
  );
}
