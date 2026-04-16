import SurfaceCard from "@/components/SurfaceCard";
import { formatTaskTimestamp, type TaskRecord } from "@/components/task-api";

interface ExecutionPanelProps {
  task: TaskRecord;
}

export default function ExecutionPanel({ task }: ExecutionPanelProps) {
  const hasExecutionOutput = Boolean(
    task.codexOutput || task.errorMessage || task.runStartedAt || task.runFinishedAt || task.executionMode || task.contextSummary
  );

  if (!hasExecutionOutput) {
    return null;
  }

  return (
    <SurfaceCard eyebrow="Diagnostics" title="Execution output" description="Trace the runtime envelope around the prompt preview and verification steps.">
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Created" value={formatTaskTimestamp(task.createdAt ?? task.updatedAt)} />
        <Metric label="Run started" value={task.runStartedAt ? formatTaskTimestamp(task.runStartedAt) : "Not started yet"} />
        <Metric label="Run finished" value={task.runFinishedAt ? formatTaskTimestamp(task.runFinishedAt) : "Still running"} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Metric label="Execution mode" value={task.executionMode || "Unknown"} />
        <Metric label="Context summary" value={task.contextSummary || "No context summary captured yet."} />
      </div>

      {task.errorMessage ? (
        <div className="mt-4 rounded-[22px] border border-[#ecd3d1] bg-[#fbefee] px-4 py-4 text-sm text-[#9b4740]">{task.errorMessage}</div>
      ) : null}

      <div className="mt-4 rounded-[22px] border border-[#e8e0d4] bg-[#fbfaf7] p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-[#8c8377]">Codex / engine summary</p>
        <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-7 text-[#4f473d]">
          {task.codexOutput || "No execution summary has been captured yet."}
        </pre>
      </div>
    </SurfaceCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[#e8e0d4] bg-[#faf6f0] px-4 py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8c8377]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[#1f1c17]">{value}</p>
    </div>
  );
}
