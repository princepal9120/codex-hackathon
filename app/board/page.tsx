'use client';

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Sparkles } from "lucide-react";

import CreateTaskModal from "@/components/CreateTaskModal";
import TaskColumn from "@/components/TaskColumn";
import {
  fetchTask,
  fetchTasks,
  formatTaskTimestamp,
  getConfidenceLabel,
  getTaskIdentifier,
  getTaskStatusMeta,
  isTerminalStatus,
  retryTask,
  runTask,
  TASK_REFRESH_INTERVAL_MS,
  type TaskRecord,
  type TaskSource,
  type TaskStatus,
} from "@/components/task-api";
import { Button } from "@/components/ui/Button";
import Shell from "@/components/Shell";

const columnOrder: TaskStatus[] = ["queued", "running", "passed", "failed", "needs_review"];

export default function BoardPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingList, setRefreshingList] = useState(false);
  const [refreshingDetail, setRefreshingDetail] = useState(false);
  const [runningTask, setRunningTask] = useState(false);
  const [retryingTask, setRetryingTask] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [source, setSource] = useState<TaskSource>("api");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const result = await fetchTasks();
        if (!active) return;
        setTasks(result.tasks);
        setSource(result.source);
        setMessage(result.message ?? null);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => {
      const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return tb - ta;
    }),
    [tasks],
  );

  return (
    <Shell>
      {/* Board header */}
      <header className="flex items-center justify-between gap-4 border-b border-border bg-background px-6 py-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">Task Board</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {loading ? "Loading…" : `${sortedTasks.length} tasks`} · Kanban view
            {source === "mock" && " · Demo data"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      </header>

      {/* Status message */}
      {message && (
        <div className="border-b border-border bg-muted/50 px-6 py-2.5 text-sm text-muted-foreground">{message}</div>
      )}

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading tasks…
          </div>
        ) : sortedTasks.length === 0 && !message ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="rounded-lg border border-dashed border-border bg-card p-10">
              <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <h2 className="mt-4 text-lg font-semibold text-foreground">No tasks yet</h2>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                Create your first task to see the execution pipeline in action.
              </p>
              <Button className="mt-5 gap-2" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Create your first task
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex h-full gap-4" style={{ minWidth: `${columnOrder.length * 296}px` }}>
            {columnOrder.map((status) => (
              <TaskColumn key={status} status={status} tasks={sortedTasks} />
            ))}
          </div>
        )}
      </div>

      <CreateTaskModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </Shell>
  );
}
