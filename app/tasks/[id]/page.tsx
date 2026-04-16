'use client';

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import StatusBadge from "@/components/StatusBadge";
import FileListPanel from "@/components/FileListPanel";
import DiffPanel from "@/components/DiffPanel";
import VerificationPanel from "@/components/VerificationPanel";
import ScoreCard from "@/components/ScoreCard";
import { fetchTask, formatTaskTimestamp, isTerminalStatus, retryTask, type TaskRecord, type TaskSource } from "@/components/task-api";

interface TaskPageProps {
  params: {
    id: string;
  };
}

export default function TaskPage({ params }: TaskPageProps) {
  const [task, setTask] = useState<TaskRecord | null>(null);
  const [source, setSource] = useState<TaskSource>("api");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const loadTask = useCallback(async (background = false) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const result = await fetchTask(params.id);
    setTask(result.task);
    setSource(result.source);
    setMessage(result.message ?? null);
    setLoading(false);
    setRefreshing(false);
  }, [params.id]);

  useEffect(() => {
    void loadTask();
  }, [loadTask]);

  useEffect(() => {
    if (!task || source !== "api" || isTerminalStatus(task.status)) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadTask(true);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [loadTask, source, task]);

  const handleRetry = async () => {
    if (!task || retrying) {
      return;
    }

    setRetrying(true);
    setMessage(null);

    try {
      const nextTask = await retryTask(task.id);
      setTask(nextTask);
      setSource("api");
      setMessage("Task queued for another run.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to retry task.");
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="mb-8 flex items-center gap-3">
            <Link href="/board">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Board
              </Button>
            </Link>
          </div>
          <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center text-sm text-gray-500">
            Loading task details…
          </div>
        </div>
      </main>
    );
  }

  if (!task) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="mb-8 flex items-center gap-3">
            <Link href="/board">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Board
              </Button>
            </Link>
          </div>
          <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Task not found</h1>
            <p className="mt-2 text-sm text-gray-600">
              CodexFlow could not find task <span className="font-mono">{params.id}</span>.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {message ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {message}
          </div>
        ) : null}

        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-4">
              <Link href="/board">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
            </div>
            <h1 className="mb-2 text-4xl font-bold text-gray-900">{task.title}</h1>
            <p className="max-w-3xl text-gray-600">{task.prompt}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={task.status} />
            <Button variant="outline" size="sm" className="gap-2" onClick={() => void loadTask(true)} disabled={refreshing || retrying}>
              <RotateCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => void handleRetry()} disabled={retrying}>
              <RotateCcw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
              {retrying ? "Retrying…" : "Retry Run"}
            </Button>
          </div>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <FileListPanel task={task} />
            <ScoreCard task={task} />
          </div>

          <div className="space-y-6 lg:col-span-2">
            <DiffPanel diff={task.diff} />
            <VerificationPanel task={task} />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="mb-1 text-xs font-medium text-gray-600">Status</p>
              <p className="text-sm font-semibold capitalize text-gray-900">{task.status.replace("_", " ")}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-gray-600">Repository</p>
              <p className="break-all text-sm font-mono text-gray-900">{task.repoPath || "."}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-gray-600">Last Updated</p>
              <p className="text-sm text-gray-900">{formatTaskTimestamp(task.updatedAt)}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-gray-600">Task ID</p>
              <p className="text-sm font-mono text-gray-900">{task.id}</p>
            </div>
          </div>
          {source === "mock" ? (
            <p className="mt-4 text-xs text-gray-500">
              Showing bundled demo data until the live task detail API becomes available.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
