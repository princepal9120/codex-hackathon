'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Clock,
  Command,
  Eye,
  FolderKanban,
  Inbox,
  LayoutList,
  Loader2,
  Monitor,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Users,
  Workflow,
  XCircle,
  Zap,
} from "lucide-react";

import CreateTaskModal from "@/components/CreateTaskModal";
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
import { cn } from "@/lib/utils";

type ViewMode = "kanban" | "list";

const statusColumns: { status: TaskStatus; label: string; icon: ReactNode; emptyText: string; color: string }[] = [
  { status: "queued", label: "Queued", icon: <Clock className="h-4 w-4" />, emptyText: "No queued tasks", color: "text-gray-500" },
  { status: "running", label: "Running", icon: <Loader2 className="h-4 w-4 animate-spin" />, emptyText: "No active executions", color: "text-blue-500" },
  { status: "passed", label: "Passed", icon: <CheckCircle2 className="h-4 w-4" />, emptyText: "No completed passing tasks yet", color: "text-green-500" },
  { status: "failed", label: "Failed", icon: <XCircle className="h-4 w-4" />, emptyText: "No failed tasks", color: "text-red-500" },
  { status: "needs_review", label: "Needs Review", icon: <Eye className="h-4 w-4" />, emptyText: "No tasks waiting for review", color: "text-amber-500" },
];

const primaryNav = [
  { label: "Search", shortcut: "⌘K", icon: Search },
  { label: "New Task", shortcut: "C", icon: Plus },
  { label: "Inbox", icon: Inbox },
  { label: "My Tasks", icon: CircleDashed },
];

const workspaceNav = [
  { label: "Board", icon: FolderKanban, active: true },
  { label: "Projects", icon: Workflow },
  { label: "Autopilot", icon: Bot },
  { label: "Agents", icon: Users },
];

const configureNav = [
  { label: "Runtimes", icon: Monitor },
  { label: "Skills", icon: Sparkles },
  { label: "Settings", icon: Settings },
];

export default function BoardPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<TaskRecord | null>(null);
  const [detailSource, setDetailSource] = useState<TaskSource>("api");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshingList, setRefreshingList] = useState(false);
  const [refreshingDetail, setRefreshingDetail] = useState(false);
  const [runningTask, setRunningTask] = useState(false);
  const [retryingTask, setRetryingTask] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [detailMessage, setDetailMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  const upsertTask = useCallback((nextTask: TaskRecord) => {
    setTasks((current) => {
      const index = current.findIndex((task) => task.id === nextTask.id);
      if (index === -1) {
        return [nextTask, ...current];
      }

      const copy = [...current];
      copy[index] = nextTask;
      return copy;
    });
  }, []);

  const loadTasks = useCallback(async (background = false) => {
    if (background) {
      setRefreshingList(true);
    }

    const result = await fetchTasks();
    setTasks(result.tasks);
    setMessage(result.message ?? null);
    setLoading(false);
    setRefreshingList(false);
  }, []);

  useEffect(() => {
    let active = true;

    const syncTasks = async (background = false) => {
      if (background && active) {
        setRefreshingList(true);
      }

      const result = await fetchTasks();
      if (!active) return;

      setTasks(result.tasks);
      setMessage(result.message ?? null);
      setLoading(false);
      setRefreshingList(false);
    };

    void syncTasks(false);
    const interval = window.setInterval(() => {
      void syncTasks(true);
    }, TASK_REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const sortedTasks = useMemo(() => {
    return [...tasks]
      .map((task, index) => ({ task, index }))
      .sort((a, b) => {
        const delta = getSortValue(b.task.updatedAt) - getSortValue(a.task.updatedAt);
        return delta !== 0 ? delta : a.index - b.index;
      })
      .map(({ task }) => task);
  }, [tasks]);

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, TaskRecord[]> = {
      queued: [],
      running: [],
      passed: [],
      failed: [],
      needs_review: [],
    };

    for (const task of sortedTasks) {
      map[task.status]?.push(task);
    }

    return map;
  }, [sortedTasks]);

  const selectedTaskSummary = useMemo(
    () => sortedTasks.find((t) => t.id === selectedTaskId) ?? null,
    [selectedTaskId, sortedTasks]
  );

  const selectedTask = useMemo(() => {
    if (selectedTaskDetail && selectedTaskDetail.id === selectedTaskId) {
      return selectedTaskDetail;
    }

    return selectedTaskSummary;
  }, [selectedTaskDetail, selectedTaskId, selectedTaskSummary]);

  useEffect(() => {
    if (!selectedTaskId && sortedTasks.length > 0) {
      setSelectedTaskId(sortedTasks[0].id);
    }
  }, [selectedTaskId, sortedTasks]);

  useEffect(() => {
    if (selectedTaskSummary && (!selectedTaskDetail || selectedTaskDetail.id !== selectedTaskSummary.id)) {
      setSelectedTaskDetail(selectedTaskSummary);
    }
  }, [selectedTaskDetail, selectedTaskSummary]);

  const loadSelectedTask = useCallback(
    async (background = false) => {
      if (!selectedTaskId) {
        setSelectedTaskDetail(null);
        setDetailMessage(null);
        return;
      }

      if (background) {
        setRefreshingDetail(true);
      }

      try {
        const result = await fetchTask(selectedTaskId);
        if (result.task) {
          setSelectedTaskDetail(result.task);
          upsertTask(result.task);
        } else {
          setSelectedTaskDetail(null);
        }
        setDetailSource(result.source);
        setDetailMessage(result.message ?? null);
      } finally {
        setRefreshingDetail(false);
      }
    },
    [selectedTaskId, upsertTask]
  );

  useEffect(() => {
    void loadSelectedTask(false);
  }, [loadSelectedTask]);

  useEffect(() => {
    if (!selectedTask || isTerminalStatus(selectedTask.status)) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadSelectedTask(true);
    }, TASK_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [loadSelectedTask, selectedTask]);

  const handleRunSelectedTask = useCallback(async () => {
    if (!selectedTask || selectedTask.status !== "queued" || runningTask) {
      return;
    }

    setRunningTask(true);

    try {
      const nextTask = await runTask(selectedTask.id);
      setSelectedTaskDetail(nextTask);
      upsertTask(nextTask);
      setDetailMessage(null);
    } catch (error) {
      setDetailMessage(error instanceof Error ? error.message : "Unable to start the task.");
    } finally {
      setRunningTask(false);
    }
  }, [runningTask, selectedTask, upsertTask]);

  const handleRetrySelectedTask = useCallback(async () => {
    if (!selectedTask || !isTerminalStatus(selectedTask.status) || retryingTask) {
      return;
    }

    setRetryingTask(true);

    try {
      const nextTask = await retryTask(selectedTask.id);
      setSelectedTaskDetail(nextTask);
      upsertTask(nextTask);
      setDetailMessage(null);
    } catch (error) {
      setDetailMessage(error instanceof Error ? error.message : "Unable to retry the task.");
    } finally {
      setRetryingTask(false);
    }
  }, [retryingTask, selectedTask, upsertTask]);

  const selectedTaskAction = useMemo(() => {
    if (!selectedTask) {
      return null;
    }

    if (selectedTask.status === "queued") {
      return {
        label: runningTask ? "Starting…" : "Start task",
        icon: Play,
        onClick: handleRunSelectedTask,
        disabled: runningTask,
      };
    }

    if (isTerminalStatus(selectedTask.status)) {
      return {
        label: retryingTask ? "Retrying…" : "Retry task",
        icon: RotateCcw,
        onClick: handleRetrySelectedTask,
        disabled: retryingTask,
      };
    }

    return null;
  }, [handleRetrySelectedTask, handleRunSelectedTask, retryingTask, runningTask, selectedTask]);

  return (
    <>
      <main className="min-h-screen bg-[#0c0c0e] text-white">
        <div className="grid min-h-screen lg:grid-cols-[256px_1fr]">
          {/* ── Sidebar ── */}
          <aside className="flex flex-col overflow-hidden border-b border-white/[0.06] px-4 py-4 lg:border-b-0 lg:border-r lg:border-r-white/[0.06] lg:h-screen lg:overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between gap-3 px-2 py-1">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 shadow-lg shadow-violet-500/20">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-white/90">CodexFlow</p>
                  <p className="truncate text-xs text-white/35">Board workspace</p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/70"
                aria-label="Open command menu"
              >
                <Command className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-0.5">
              {primaryNav.map(({ label, shortcut, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={label === "New Task" ? () => setIsCreateModalOpen(true) : undefined}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-white/50 transition-colors hover:bg-white/[0.05] hover:text-white/90"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </span>
                  {shortcut ? (
                    <span className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/30">
                      {shortcut}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">Workspace</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white/80">Engineering board</p>
                  <p className="truncate text-xs text-white/30">Repo-aware task ops</p>
                </div>
                <ChevronDown className="h-4 w-4 text-white/25" />
              </div>
            </div>

            <SidebarGroup title="Workspace">
              {workspaceNav.map(({ label, icon: Icon, active }) => (
                <SidebarItem key={label} label={label} icon={<Icon className="h-4 w-4" />} active={active} />
              ))}
            </SidebarGroup>

            <SidebarGroup title="Configure">
              {configureNav.map(({ label, icon: Icon }) => (
                <SidebarItem key={label} label={label} icon={<Icon className="h-4 w-4" />} />
              ))}
            </SidebarGroup>

            <div className="mt-auto border-t border-white/[0.06] px-3 pt-5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                  P
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white/85">prince pal</p>
                  <p className="truncate text-xs text-white/35">pal265354@gmail.com</p>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Main Content Area ── */}
          {viewMode === "kanban" ? (
            <section className="flex flex-col overflow-hidden">
              {/* Top bar */}
              <div className="border-b border-white/[0.06] px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">Task Board</h1>
                    <p className="mt-1 text-sm text-white/40">
                      {sortedTasks.length} {sortedTasks.length === 1 ? "task" : "tasks"} · Kanban view · live sync every {TASK_REFRESH_INTERVAL_MS / 1000}s
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ViewToggle mode={viewMode} onChange={setViewMode} />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void loadTasks(true)}
                      disabled={refreshingList}
                      className="h-9 gap-2 border-white/[0.1] text-white/70 hover:bg-white/[0.06] hover:text-white"
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshingList ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="h-9 gap-2 bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-500/20"
                    >
                      <Plus className="h-4 w-4" />
                      New Task
                    </Button>
                  </div>
                </div>
              </div>

              {message ? (
                <div className="border-b border-amber-900/30 bg-amber-950/20 px-6 py-2.5 text-sm text-amber-200/80">{message}</div>
              ) : null}

              {/* Kanban columns */}
              <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-sm text-white/30">Loading tasks…</div>
                ) : (
                  <div className="flex h-full gap-4" style={{ minWidth: `${statusColumns.length * 280}px` }}>
                    {statusColumns.map((col) => (
                      <KanbanColumn
                        key={col.status}
                        column={col}
                        tasks={tasksByStatus[col.status]}
                        onSelectTask={(id) => {
                          setSelectedTaskId(id);
                          setViewMode("list");
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          ) : (
            /* ── List + Detail View ── */
            <div className="grid lg:grid-cols-[380px_1fr]">
              <section className="flex flex-col border-b border-white/[0.06] lg:border-b-0 lg:border-r lg:border-r-white/[0.06] lg:h-screen lg:overflow-hidden">
                <div className="border-b border-white/[0.06] px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h1 className="text-lg font-bold tracking-tight text-white">Tasks</h1>
                      <p className="mt-1 text-sm text-white/40">
                        {sortedTasks.length} tasks · live sync every {TASK_REFRESH_INTERVAL_MS / 1000}s
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ViewToggle mode={viewMode} onChange={setViewMode} />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void loadTasks(true)}
                        disabled={refreshingList}
                        className="h-8 gap-1.5 border-white/[0.1] text-white/70 hover:bg-white/[0.06] hover:text-white"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshingList ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="h-8 gap-1.5 bg-violet-600 text-white hover:bg-violet-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        New
                      </Button>
                    </div>
                  </div>
                </div>

                {message ? (
                  <div className="border-b border-amber-900/30 bg-amber-950/20 px-5 py-2.5 text-sm text-amber-200/80">{message}</div>
                ) : null}

                <div className="flex-1 overflow-y-auto scrollbar-thin">
                  {loading ? (
                    <ListPlaceholder label="Loading tasks…" />
                  ) : sortedTasks.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                      <Sparkles className="h-10 w-10 text-white/15" />
                      <h2 className="mt-4 text-lg font-semibold text-white/70">No tasks yet</h2>
                      <p className="mt-2 max-w-xs text-sm text-white/40">
                        Create a task to get started with repo-aware AI operations.
                      </p>
                      <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mt-4 h-9 bg-violet-600 text-white hover:bg-violet-700"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Task
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.04]">
                      {sortedTasks.map((task) => (
                        <TaskListItem
                          key={task.id}
                          task={task}
                          selected={selectedTaskId === task.id}
                          onSelect={() => setSelectedTaskId(task.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Detail panel */}
              <section className="flex flex-col overflow-y-auto lg:h-screen scrollbar-thin">
                {selectedTask ? (
                  <>
                    <div className="border-b border-white/[0.06] px-6 py-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <MetaPill label={getTaskIdentifier(selectedTask.id)} />
                            <StatusBadge task={selectedTask} />
                          </div>
                          <h2 className="mt-3 text-xl font-bold tracking-tight text-white">
                            {selectedTask.title}
                          </h2>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                            {selectedTask.contextSummary || selectedTask.prompt}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5">
                            <span className="text-xs text-white/50">Confidence</span>
                            <span className="font-semibold text-white">{getConfidenceLabel(selectedTask.score)}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void loadSelectedTask(true)}
                            disabled={refreshingDetail}
                            className="gap-1.5 border-white/[0.1] text-white/70 hover:bg-white/[0.06] hover:text-white"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${refreshingDetail ? "animate-spin" : ""}`} />
                            Refresh
                          </Button>
                          {selectedTaskAction ? (
                            <Button
                              size="sm"
                              onClick={selectedTaskAction.onClick}
                              disabled={selectedTaskAction.disabled}
                              className="gap-1.5 bg-violet-600 text-white hover:bg-violet-700"
                            >
                              <selectedTaskAction.icon className={`h-3.5 w-3.5 ${selectedTaskAction.disabled ? "animate-spin" : ""}`} />
                              {selectedTaskAction.label}
                            </Button>
                          ) : null}
                          <Link href={`/tasks/${selectedTask.id}`}>
                            <Button size="sm" variant="outline" className="gap-1.5 border-white/[0.1] text-white/70 hover:bg-white/[0.06] hover:text-white">
                              Full view
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {detailMessage ? (
                      <div className="border-b border-amber-900/30 bg-amber-950/20 px-6 py-2.5 text-sm text-amber-200/80">
                        {detailMessage}
                      </div>
                    ) : null}

                    <div className="flex-1 overflow-y-auto">
                      <div className="grid divide-y divide-white/[0.06] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                        <DetailSection title="Prompt" eyebrow="Context">
                          <p className="text-sm leading-7 text-white/60">
                            {selectedTask.promptPreview || selectedTask.prompt}
                          </p>
                        </DetailSection>
                        <DetailSection title="Verification" eyebrow="Status">
                          <div className="space-y-2">
                            <VerificationRow label="Lint" status={selectedTask.lintStatus} />
                            <VerificationRow label="Tests" status={selectedTask.testStatus} />
                            <VerificationRow
                              label="Confidence"
                              status={getConfidenceStatus(selectedTask.score)}
                              value={selectedTask.score !== null ? `${selectedTask.score}/100` : "Pending"}
                            />
                            <KeyValueRow label="Data source" value={detailSource === "api" ? "Live API" : "Fallback data"} />
                          </div>
                        </DetailSection>
                      </div>

                      <div className="grid divide-y divide-white/[0.06] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                        <DetailSection title="Files" eyebrow="Repo context">
                          <div className="space-y-2">
                            {selectedTask.selectedFiles.length > 0 ? (
                              selectedTask.selectedFiles.slice(0, 5).map((file) => (
                                <div key={file.path} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="truncate font-mono text-xs text-white/60">{file.path}</p>
                                    {file.score && <span className="text-xs text-white/30">{file.score}</span>}
                                  </div>
                                  {file.rationale && (
                                    <p className="mt-1.5 text-xs leading-5 text-white/40">{file.rationale}</p>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-white/30">No files selected</p>
                            )}
                          </div>
                        </DetailSection>
                        <DetailSection title="Execution" eyebrow="Details">
                          <div className="space-y-2">
                            <KeyValueRow label="Repository" value={selectedTask.repoPath || "."} mono />
                            <KeyValueRow label="Mode" value={selectedTask.executionMode || "Task run"} />
                            {selectedTask.failureSignal && (
                              <div className="rounded-lg border border-red-900/30 bg-red-950/20 px-3 py-2.5 text-xs">
                                <p className="font-medium text-red-300">{selectedTask.failureSignal.summary}</p>
                                <p className="mt-1 text-red-200/60">{selectedTask.failureSignal.detail}</p>
                              </div>
                            )}
                          </div>
                        </DetailSection>
                      </div>

                      <div className="grid divide-y divide-white/[0.06] border-t border-white/[0.06] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                        <DetailSection title="Timeline" eyebrow="Run history">
                          <div className="space-y-2">
                            {selectedTask.timeline.length > 0 ? (
                              selectedTask.timeline.slice(-5).reverse().map((event) => (
                                <div key={event.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-medium text-white/80">{event.title}</p>
                                    <span className="text-[10px] text-white/35">{formatTaskTimestamp(event.createdAt)}</span>
                                  </div>
                                  <p className="mt-1.5 text-xs leading-5 text-white/45">{event.detail}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-white/30">No timeline events yet.</p>
                            )}
                          </div>
                        </DetailSection>
                        <DetailSection title="Diff" eyebrow="Patch">
                          <pre className="overflow-x-auto rounded-lg border border-white/[0.06] bg-black/40 p-4 text-[11px] leading-5">
                            {getPatchPreview(selectedTask).split("\n").map((line, i) => (
                              <span
                                key={i}
                                className={
                                  line.startsWith("+")
                                    ? "block text-green-400"
                                    : line.startsWith("-")
                                      ? "block text-red-400"
                                      : line.startsWith("@@")
                                        ? "block text-blue-400"
                                        : "block text-white/50"
                                }
                              >
                                {line}
                              </span>
                            ))}
                          </pre>
                        </DetailSection>
                      </div>

                      <div className="grid divide-y divide-white/[0.06] border-t border-white/[0.06] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                        <DetailSection title="Logs" eyebrow="Output">
                          <div className="space-y-2">
                            <LogBlock title="Lint" body={selectedTask.lintOutput} />
                            <LogBlock title="Tests" body={selectedTask.testOutput} />
                          </div>
                        </DetailSection>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                    <Sparkles className="h-10 w-10 text-white/15" />
                    <h2 className="mt-4 text-lg font-semibold text-white/60">Select a task</h2>
                    <p className="mt-2 max-w-xs text-sm text-white/40">
                      Pick a task from the list to view details, context, and verification results.
                    </p>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>

      <CreateTaskModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
    </>
  );
}

/* ── Sub-components ── */

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (mode: ViewMode) => void }) {
  return (
    <div className="flex items-center rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
      <button
        type="button"
        onClick={() => onChange("kanban")}
        className={cn(
          "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
          mode === "kanban" ? "bg-white/[0.1] text-white" : "text-white/40 hover:text-white/70"
        )}
        aria-label="Kanban view"
      >
        <FolderKanban className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        className={cn(
          "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
          mode === "list" ? "bg-white/[0.1] text-white" : "text-white/40 hover:text-white/70"
        )}
        aria-label="List view"
      >
        <LayoutList className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function KanbanColumn({
  column,
  tasks,
  onSelectTask,
}: {
  column: (typeof statusColumns)[number];
  tasks: TaskRecord[];
  onSelectTask: (id: string) => void;
}) {
  return (
    <div className="flex w-[270px] shrink-0 flex-col rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={column.color}>{column.icon}</span>
          <span className="text-sm font-semibold text-white/80">{column.label}</span>
        </div>
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-white/40">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin">
        {tasks.length === 0 ? (
          <div className="flex h-32 items-center justify-center px-4 text-center">
            <p className="text-xs text-white/25">{column.emptyText}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <KanbanCard key={task.id} task={task} onSelect={() => onSelectTask(task.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanCard({
  task,
  onSelect,
}: {
  task: TaskRecord;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 text-left transition-all duration-200 hover:border-violet-500/20 hover:bg-white/[0.06]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/30">
          {getTaskIdentifier(task.id)}
        </span>
        {task.score !== null && (
          <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
            {task.score}/100
          </span>
        )}
      </div>
      <h4 className="mt-2 text-sm font-medium leading-tight text-white/85">{task.title}</h4>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/40">
        {task.contextSummary || task.prompt}
      </p>
      <div className="mt-3 flex items-center justify-between text-[10px] text-white/30">
        <span>{task.selectedFiles.length} files</span>
        <span>{formatTaskTimestamp(task.updatedAt)}</span>
      </div>
    </button>
  );
}

function SidebarGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-6">
      <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/20">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarItem({ label, icon, active = false }: { label: string; icon: ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
        active ? "bg-violet-500/10 text-violet-300" : "text-white/45 hover:bg-white/[0.04] hover:text-white/80"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function TaskListItem({
  task,
  selected,
  onSelect,
}: {
  task: TaskRecord;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full px-4 py-3.5 text-left transition-all duration-150",
        selected
          ? "bg-violet-500/10 border-l-2 border-l-violet-500"
          : "hover:bg-white/[0.03] border-l-2 border-l-transparent"
      )}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-white/30">{getTaskIdentifier(task.id)}</p>
            <StatusBadge task={task} />
          </div>
          <p className="text-[11px] text-white/30">{formatTaskTimestamp(task.updatedAt)}</p>
        </div>
        <h3 className="text-sm font-semibold leading-tight text-white/90">{task.title}</h3>
        <p className="line-clamp-2 text-xs leading-5 text-white/40">{task.contextSummary || task.prompt}</p>
        <div className="flex items-center justify-between gap-3 text-[10px] text-white/25">
          <span>{task.selectedFiles.length} files</span>
          <span className="font-mono">{task.repoPath || "root"}</span>
        </div>
      </div>
    </button>
  );
}

function StatusBadge({ task }: { task: TaskRecord }) {
  const meta = getTaskStatusMeta(task.status);

  const colorMap: Record<string, { bg: string; text: string }> = {
    passed: { bg: "bg-green-500/10", text: "text-green-400" },
    running: { bg: "bg-blue-500/10", text: "text-blue-400" },
    failed: { bg: "bg-red-500/10", text: "text-red-400" },
    needs_review: { bg: "bg-amber-500/10", text: "text-amber-400" },
    queued: { bg: "bg-white/[0.06]", text: "text-white/50" },
  };

  const colors = colorMap[task.status] || colorMap.queued;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        colors.bg,
        colors.text,
        task.status === "running" && "status-pulse"
      )}
    >
      {meta.label}
    </span>
  );
}

function MetaPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-xs font-medium text-white/50">
      {label}
    </span>
  );
}

function DetailSection({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="px-5 py-5">
      <p className="text-[10px] uppercase tracking-widest text-white/30">{eyebrow}</p>
      <h3 className="mt-1.5 text-sm font-semibold text-white/90">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function VerificationRow({
  label,
  status,
  value,
}: {
  label: string;
  status: "passed" | "failed" | "pending";
  value?: string;
}) {
  const Icon = status === "passed" ? CheckCircle2 : status === "failed" ? XCircle : CircleDashed;
  const iconColor = status === "passed" ? "text-green-400" : status === "failed" ? "text-red-400" : "text-white/25";

  return (
    <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <span className="text-xs text-white/50 font-medium">{label}</span>
      <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", iconColor)}>
        <Icon className="h-3.5 w-3.5" />
        {value ?? (status === "passed" ? "Passed" : status === "failed" ? "Failed" : "Pending")}
      </span>
    </div>
  );
}

function KeyValueRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-widest text-white/30">{label}</p>
      <p className={cn("mt-1.5 text-sm text-white/60 font-medium", mono && "font-mono text-xs")}>{value}</p>
    </div>
  );
}

function LogBlock({ title, body }: { title: string; body?: string | null }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-black/30 p-3">
      <p className="text-[10px] uppercase tracking-widest text-white/30">{title}</p>
      <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-white/40">
        {body?.trim() || "No output"}
      </pre>
    </div>
  );
}

function ListPlaceholder({ label }: { label: string }) {
  return (
    <div className="space-y-1 px-2 py-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="space-y-2 px-2 py-3">
          <div className="h-2.5 w-20 rounded bg-white/[0.06]" />
          <div className="h-3.5 w-2/3 rounded bg-white/[0.05]" />
          <div className="h-2 w-full rounded bg-white/[0.04]" />
        </div>
      ))}
      <p className="pt-2 text-center text-xs text-white/20">{label}</p>
    </div>
  );
}

function getPatchPreview(task: TaskRecord) {
  if (!task.diff) {
    return task.patchSummary || "Patch preview will appear here once the task generates a diff artifact.";
  }
  return task.diff.split("\n").slice(0, 26).join("\n");
}

function getConfidenceStatus(score: number | null): "passed" | "failed" | "pending" {
  if (score === null) return "pending";
  return score >= 70 ? "passed" : "failed";
}

function getSortValue(value?: string | null) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}
