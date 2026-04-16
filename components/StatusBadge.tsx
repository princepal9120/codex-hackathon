import { Badge } from "@/components/ui/Badge";
import { getTaskStatusMeta, type TaskStatus } from "@/components/task-api";

interface StatusBadgeProps {
  status: TaskStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = getTaskStatusMeta(status);
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
