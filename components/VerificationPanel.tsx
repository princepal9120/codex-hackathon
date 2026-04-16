import { CheckCircle2, Clock, XCircle } from "lucide-react";

import SurfaceCard from "@/components/SurfaceCard";
import { getVerificationMeta, type TaskRecord, type VerificationStatus } from "@/components/task-api";
import { Badge } from "@/components/ui/Badge";

interface VerificationPanelProps {
  task: TaskRecord;
}

const getStatusIcon = (status: VerificationStatus) => {
  switch (status) {
    case "passed":
      return <CheckCircle2 className="h-5 w-5 text-[#277a46]" />;
    case "failed":
      return <XCircle className="h-5 w-5 text-[#b65858]" />;
    case "pending":
      return <Clock className="h-5 w-5 text-[#8a8176]" />;
  }
};

export default function VerificationPanel({ task }: VerificationPanelProps) {
  return (
    <SurfaceCard
      eyebrow="Trust signals"
      title="Verification evidence"
      description="Lint, tests, notes, and raw outputs that justify whether the patch preview should be trusted."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <VerificationRow label="Lint" status={task.lintStatus} />
        <VerificationRow label="Tests" status={task.testStatus} />
      </div>

      {task.verificationNotes ? (
        <div className="mt-4 rounded-[22px] border border-[#d5ead8] bg-[#eef8f0] px-4 py-4 text-sm leading-6 text-[#2f7246]">{task.verificationNotes}</div>
      ) : null}
      {task.lintOutput ? <OutputBlock label="Lint output" value={task.lintOutput} /> : null}
      {task.testOutput ? <OutputBlock label="Test output" value={task.testOutput} /> : null}
      {task.logs ? <OutputBlock label="Execution logs" value={task.logs} /> : null}
    </SurfaceCard>
  );
}

function VerificationRow({ label, status }: { label: string; status: VerificationStatus }) {
  const meta = getVerificationMeta(status);

  return (
    <div className="rounded-[22px] border border-[#e8e0d4] bg-[#faf6f0] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {getStatusIcon(status)}
          <span className="text-sm font-medium text-[#1f1c17]">{label}</span>
        </div>
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </div>
    </div>
  );
}

function OutputBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4 rounded-[22px] border border-[#e8e0d4] bg-[#fbfaf7] p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-[#8c8377]">{label}</p>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-7 text-[#4f473d]">{value}</pre>
    </div>
  );
}
