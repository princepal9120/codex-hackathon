import { MoreHorizontal, Plus } from "lucide-react";

import TaskCard from "@/components/TaskCard";
import { type TaskRecord, type TaskStatus } from "@/components/task-api";

interface TaskColumnProps {
  status: TaskStatus;
  title: string;
  tasks: TaskRecord[];
}

const emptyStateMessages: Record<TaskStatus, string> = {
  queued: "No queued tasks yet",
  running: "No active executions right now",
  passed: "No verified tasks yet",
  failed: "No blocked runs right now",
  needs_review: "No review queue at the moment",
};

const columnStyles: Record<TaskStatus, string> = {
  queued: "border-[#ece7dd] bg-[#f7f4ee]",
  running: "border-[#efdfb6] bg-[#fbf4df]",
  passed: "border-[#d5e6dd] bg-[#edf5f0]",
  failed: "border-[#ecd6d5] bg-[#f7ebea]",
  needs_review: "border-[#dfd9f0] bg-[#f2eefb]",
};

const dotStyles: Record<TaskStatus, string> = {
  queued: "bg-[#b2aa9a]",
  running: "bg-[#d9a112]",
  passed: "bg-[#2f9957]",
  failed: "bg-[#c85e5e]",
  needs_review: "bg-[#8a63d2]",
};

export default function TaskColumn({ status, title, tasks }: TaskColumnProps) {
  const columnTasks = tasks.filter((task) => task.status === status);

  return (
    <section className={`flex min-w-[290px] flex-1 flex-col rounded-[24px] border p-3 ${columnStyles[status]}`}>
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${dotStyles[status]}`} />
          <h2 className="text-[13px] font-semibold text-[#3b3732]">{title}</h2>
          <span className="text-[12px] text-[#8c867c]">{columnTasks.length}</span>
        </div>
        <div className="flex items-center gap-1 text-[#9a9388]">
          <button type="button" className="rounded-full p-1 transition-colors hover:bg-white/60" aria-label={`${title} options`}>
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <button type="button" className="rounded-full p-1 transition-colors hover:bg-white/60" aria-label={`Add ${title} task`}>
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex min-h-[520px] flex-1 flex-col gap-3 overflow-y-auto px-1 pb-1">
        {columnTasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-[18px] border border-dashed border-[#d8d1c7] bg-white/55 p-6 text-center text-[13px] text-[#8f897f]">
            {emptyStateMessages[status]}
          </div>
        ) : (
          columnTasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </section>
  );
}
