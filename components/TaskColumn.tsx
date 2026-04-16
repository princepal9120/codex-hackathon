import { type ReactNode, useMemo } from "react";
import { CheckCircle2, Clock, Eye, Loader2, XCircle } from "lucide-react";
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import TaskCard from "@/components/TaskCard";
import { type TaskRecord, type TaskStatus } from "@/components/task-api";

interface TaskColumnProps {
  status: TaskStatus;
  taskIds: string[];
  taskMap: Map<string, TaskRecord>;
  selectedTaskId?: string | null;
  onSelectTask?: (task: TaskRecord) => void;
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

export default function TaskColumn({ status, taskIds, taskMap, selectedTaskId, onSelectTask }: TaskColumnProps) {
  const config = columnConfig[status];

  const { setNodeRef, isOver } = useDroppable({ id: status });

  // Resolve IDs to Task objects (already sorted by parent)
  const resolvedTasks = useMemo(
    () =>
      taskIds.flatMap((id) => {
        const task = taskMap.get(id);
        return task ? [task] : [];
      }),
    [taskIds, taskMap]
  );

  return (
    <section className="flex w-[280px] shrink-0 flex-col rounded-lg border border-border bg-card/50">
      {/* Column header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          {config.icon}
          <h2 className="text-[13px] font-semibold text-foreground">{config.title}</h2>
        </div>
        <span className="rounded-[var(--radius)] bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
          {taskIds.length}
        </span>
      </div>

      {/* Column body */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-2 scrollbar-thin transition-colors ${isOver ? "bg-accent/40" : ""
          }`}
        style={{ maxHeight: "calc(100vh - 160px)" }}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {resolvedTasks.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 text-center">
              <p className="text-[12px] text-muted-foreground">{config.emptyText}</p>
            </div>
          ) : (
            <div className="space-y-2 pb-2">
              {resolvedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isSelected={task.id === selectedTaskId}
                  onSelect={onSelectTask}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </div>
    </section>
  );
}
