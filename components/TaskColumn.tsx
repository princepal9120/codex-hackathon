import { type ReactNode } from "react";
import { CheckCircle2, Clock, Eye, Loader2, XCircle } from "lucide-react";

import TaskCard from "@/components/TaskCard";
import { type TaskRecord, type TaskStatus } from "@/components/task-api";

interface TaskColumnProps {
  status: TaskStatus;
  tasks: TaskRecord[];
}

const columnConfig: Record<TaskStatus, {
  title: string;
  icon: ReactNode;
  emptyText: string;
}> = {
  queued: {
    title: "Queued",
    icon: <Clock className="h-3.5 w-3.5" />,
    emptyText: "No queued tasks",
  },
  running: {
    title: "Running",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    emptyText: "No active executions",
  },
  passed: {
    title: "Passed",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    emptyText: "No verified tasks yet",
  },
  failed: {
    title: "Failed",
    icon: <XCircle className="h-3.5 w-3.5" />,
    emptyText: "No blocked runs",
  },
  needs_review: {
    title: "Needs Review",
    icon: <Eye className="h-3.5 w-3.5" />,
    emptyText: "No tasks pending review",
  },
};

export default function TaskColumn({ status, tasks }: TaskColumnProps) {
  const config = columnConfig[status];
  const columnTasks = tasks.filter((t) => t.status === status);

  return (
    <section className="flex w-[280px] shrink-0 flex-col rounded-lg border border-border bg-card/50">
      {/* Column header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          {config.icon}
          <h2 className="text-[13px] font-semibold text-foreground">{config.title}</h2>
        </div>
        <span className="rounded-[var(--radius)] bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
          {columnTasks.length}
        </span>
      </div>

      {/* Column body */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin" style={{ maxHeight: "calc(100vh - 160px)" }}>
        {columnTasks.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 text-center">
            <p className="text-[12px] text-muted-foreground">{config.emptyText}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {columnTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
