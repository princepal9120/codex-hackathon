'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import SurfaceCard from "@/components/SurfaceCard";
import TaskColumn from "@/components/TaskColumn";
import { Button } from "@/components/ui/Button";
import {
  fetchTasks,
  formatTaskTimestamp,
  type TaskRecord,
  type TaskSource,
} from "@/components/task-api";

const boardColumns = [
  { status: "queued", title: "Queued" },
  { status: "running", title: "Running" },
  { status: "needs_review", title: "Needs Review" },
  { status: "passed", title: "Passed" },
  { status: "failed", title: "Failed" },
] as const;

export default function TaskBoard() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [source, setSource] = useState<TaskSource>("api");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTasks = useCallback(async (background = false) => {
    if (!background) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const result = await fetchTasks();
      setTasks(result.tasks);
      setSource(result.source);
      setMessage(result.message ?? null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks(false);

    const interval = window.setInterval(() => {
      void loadTasks(true);
    }, 4000);

    return () => window.clearInterval(interval);
  }, [loadTasks]);

  const counts = useMemo(
    () => ({
      total: tasks.length,
      queued: tasks.filter((task) => task.status === "queued").length,
      running: tasks.filter((task) => task.status === "running").length,
      review: tasks.filter((task) => task.status === "needs_review").length,
      passed: tasks.filter((task) => task.status === "passed").length,
      failed: tasks.filter((task) => task.status === "failed").length,
    }),
    [tasks]
  );

  const highlightedTask = useMemo(
    () => tasks.find((task) => task.status === "running") ?? tasks[0] ?? null,
    [tasks]
  );

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 pb-16">
      <PageHeader
        eyebrow="Execution board"
        title="Track every repo-aware coding run"
        description="Watch tasks move from queued to verified with the exact context bundle, patch preview, and trust signals that justify each result."
        badge={source === "api" ? "Live pipeline" : "API unavailable"}
        meta={[
          { label: "Tracked tasks", value: loading ? "Loading…" : String(counts.total) },
          { label: "Queued", value: String(counts.queued) },
          { label: "Running", value: String(counts.running) },
          { label: "Needs review", value: String(counts.review) },
        ]}
        actions={
          <>
            <Button variant="outline" className="gap-2" onClick={() => void loadTasks(true)} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing…" : "Refresh board"}
            </Button>
            {highlightedTask ? (
              <Link href={`/tasks/${highlightedTask.id}`}>
                <Button className="gap-2">
                  Open latest task
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : null}
          </>
        }
      />

      {message ? (
        <div className="mt-6 rounded-[22px] border border-[#ead7b9] bg-[#fff6e8] px-4 py-3 text-sm text-[#9a6a22]">{message}</div>
      ) : null}

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <SurfaceCard
          eyebrow="Board discipline"
          title="Review-first lanes"
          description="The board stays scoped to the hackathon MVP: intake, execution, review, and verification. No extra collaboration product layer is required to understand a run."
          tone="soft"
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Passed" value={String(counts.passed)} helper="Verification cleared" />
            <StatTile label="Failed" value={String(counts.failed)} helper="Needs investigation" />
            <StatTile label="Running" value={String(counts.running)} helper="Polling every 4s" />
            <StatTile label="Review queue" value={String(counts.review)} helper="Human gate remains" />
          </div>
        </SurfaceCard>

        <SurfaceCard
          eyebrow="Live signal"
          title="Most recent task"
          description="One task record should tell the whole story: why files were selected, what patch was proposed, and whether verification backed it up."
        >
          {highlightedTask ? (
            <div className="rounded-[24px] border border-[#e7ded2] bg-white p-5 shadow-[0_12px_28px_rgba(31,24,18,0.05)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c8377]">Latest activity</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#1f1c17]">{highlightedTask.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#6f675d]">{highlightedTask.contextSummary || highlightedTask.prompt}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <StatTile label="Selected files" value={String(highlightedTask.selectedFiles.length)} helper="Context bundle" />
                <StatTile label="Updated" value={formatTaskTimestamp(highlightedTask.updatedAt)} helper={highlightedTask.status.replace("_", " ")} />
              </div>
              <div className="mt-5">
                <Link href={`/tasks/${highlightedTask.id}`}>
                  <Button variant="outline" className="gap-2">
                    Open task detail
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-[#e6ded3] bg-[#faf6f0] px-5 py-12 text-center text-sm text-[#7b7267]">
              {loading ? "Loading tasks…" : "No tasks yet. Create one from the navbar to start the pipeline."}
            </div>
          )}
        </SurfaceCard>
      </section>

      <section className="mt-6 flex gap-4 overflow-x-auto pb-2 xl:grid xl:grid-cols-5 xl:overflow-visible">
        {boardColumns.map((column) => (
          <TaskColumn key={column.status} status={column.status} title={column.title} tasks={tasks} />
        ))}
      </section>
    </main>
  );
}

function StatTile({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[20px] border border-[#ece4d8] bg-[#faf6f0] px-4 py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8b8378]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[#1f1c17]">{value}</p>
      <p className="mt-1 text-xs text-[#857d72]">{helper}</p>
    </div>
  );
}
