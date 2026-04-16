'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, RotateCcw } from "lucide-react";

import DiffPanel from "@/components/DiffPanel";
import ExecutionPanel from "@/components/ExecutionPanel";
import FileListPanel from "@/components/FileListPanel";
import PageHeader from "@/components/PageHeader";
import PromptPreviewPanel from "@/components/PromptPreviewPanel";
import ScoreCard from "@/components/ScoreCard";
import SurfaceCard from "@/components/SurfaceCard";
import TaskTimelinePanel from "@/components/TaskTimelinePanel";
import TaskWorkflowPanel from "@/components/TaskWorkflowPanel";
import VerificationPanel from "@/components/VerificationPanel";
import { Button } from "@/components/ui/Button";
import {
  fetchTask,
  formatTaskTimestamp,
  getTaskIdentifier,
  isTerminalStatus,
  retryTask,
  type TaskRecord,
  type TaskSource,
} from "@/components/task-api";
import StatusPill from "@/features/dashboard/status-pill";

interface TaskDetailProps {
  id: string;
}

export default function TaskDetail({ id }: TaskDetailProps) {
  const [task, setTask] = useState<TaskRecord | null>(null);
  const [source, setSource] = useState<TaskSource>("api");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const loadTask = useCallback(
    async (background = false) => {
      if (!background) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const result = await fetchTask(id);
        setTask(result.task);
        setSource(result.source);
        setMessage(result.message ?? null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    void loadTask(false);
  }, [loadTask]);

  useEffect(() => {
    if (!task || isTerminalStatus(task.status)) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadTask(true);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [loadTask, task]);

  const handleRetry = useCallback(async () => {
    if (!task || retrying) return;

    setRetrying(true);

    try {
      const nextTask = await retryTask(task.id);
      setTask(nextTask);
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to retry the task.");
    } finally {
      setRetrying(false);
    }
  }, [retrying, task]);

  const summaryMeta = useMemo(() => {
    if (!task) return [];

    return [
      { label: "Status", value: <StatusPill status={task.status} /> },
      { label: "Repo target", value: task.repoPath || "." },
      { label: "Selected files", value: `${task.selectedFiles.length} files` },
      { label: "Last updated", value: formatTaskTimestamp(task.updatedAt) },
    ];
  }, [task]);

  if (loading && !task) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8 pb-16">
        <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-20 shadow-lg shadow-gray-900/5">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
            <p className="mt-4 text-sm text-gray-500">Loading task detail…</p>
          </div>
        </div>
      </main>
    );
  }

  if (!task) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-8 pb-16">
        <Link href="/board">
          <Button variant="ghost" className="gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Back to board
          </Button>
        </Link>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white px-6 py-12 shadow-lg shadow-gray-900/5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-600">Missing task</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">Task not found</h1>
          <p className="mt-4 max-w-md mx-auto text-sm leading-7 text-gray-600">
            {message || "CodexFlow could not find a task for this identifier."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 pb-16">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href="/board">
          <Button variant="ghost" className="gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Back to board
          </Button>
        </Link>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => void loadTask(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing…" : "Refresh task"}
        </Button>
      </div>

      <PageHeader
        eyebrow={getTaskIdentifier(task.id)}
        title={task.title}
        description={task.prompt}
        badge={source === "api" ? "Live task" : "API unavailable"}
        meta={summaryMeta}
        actions={
          <Button
            className="gap-2 bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-500/20"
            onClick={handleRetry}
            disabled={retrying}
          >
            <RotateCcw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
            {retrying ? "Retrying…" : "Retry task"}
          </Button>
        }
      />

      {message ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</div>
      ) : null}

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
        <div className="space-y-6">
          <SurfaceCard
            eyebrow="Run summary"
            title="Execution overview"
            description="Operator-facing facts before diving into the patch preview and raw outputs."
            tone="soft"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <SummaryTile label="Status" value={<StatusPill status={task.status} />} />
              <SummaryTile label="Execution mode" value={task.executionMode || "Pending"} />
              <SummaryTile label="Lint command" value={task.lintCommand || "Server default"} />
              <SummaryTile label="Test command" value={task.testCommand || "Server default"} />
              <SummaryTile label="Run started" value={task.runStartedAt ? formatTaskTimestamp(task.runStartedAt) : "Not started yet"} />
              <SummaryTile label="Run finished" value={task.runFinishedAt ? formatTaskTimestamp(task.runFinishedAt) : "Still running"} />
            </div>
          </SurfaceCard>

          <TaskWorkflowPanel task={task} />
          <ScoreCard task={task} />
          <FileListPanel task={task} />
        </div>

        <div className="space-y-6">
          <TaskTimelinePanel task={task} maxItems={10} title="Execution timeline" />
          <PromptPreviewPanel task={task} />
          <DiffPanel diff={task.diff} patchSummary={task.patchSummary} />
          <VerificationPanel task={task} />
          <ExecutionPanel task={task} />
        </div>
      </section>
    </main>
  );
}

function SummaryTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <div className="mt-1.5 text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}
