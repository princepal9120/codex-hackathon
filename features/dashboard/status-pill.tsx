import { Badge } from "@/components/ui/Badge";
import { getTaskStatusMeta, type TaskStatus } from "@/components/task-api";

export default function StatusPill({ status }: { status: TaskStatus }) {
  const meta = getTaskStatusMeta(status);

  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
