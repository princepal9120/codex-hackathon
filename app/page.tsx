'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Github, Layers3, PlayCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { fetchTasks, formatTaskTimestamp, type TaskRecord, type TaskSource } from "@/components/task-api";

export default function LandingPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [source, setSource] = useState<TaskSource>("api");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const result = await fetchTasks();
      if (!active) {
        return;
      }

      setTasks(result.tasks);
      setSource(result.source);
      setMessage(result.message ?? null);
      setLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(
    () => ({
      total: tasks.length,
      passed: tasks.filter((task) => task.status === "passed").length,
      running: tasks.filter((task) => task.status === "running").length,
      reviewed: tasks.filter((task) => task.status === "needs_review").length,
    }),
    [tasks]
  );

  const featuredTask = useMemo(
    () => tasks.find((task) => task.diff || task.selectedFiles.length > 0) ?? tasks[0] ?? null,
    [tasks]
  );

  return (
    <main className="min-h-screen bg-white">
      <section className="border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <Badge variant="secondary" className="mb-6">Repo-aware execution pipeline</Badge>
              <h1 className="mb-6 text-5xl font-bold leading-tight text-gray-900 sm:text-6xl">
                Make Codex work on real codebases
              </h1>
              <p className="mb-8 max-w-3xl text-xl leading-relaxed text-gray-600">
                CodexFlow turns a coding request into an observable pipeline: pick repo context, execute the task,
                run lint and tests, and review the resulting diff in one place.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/board">
                  <Button size="lg" className="gap-2">
                    Open Live Board
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="lg" className="gap-2">
                    <Github className="h-5 w-5" />
                    View GitHub
                  </Button>
                </a>
              </div>
              {message ? (
                <p className="mt-4 text-sm text-amber-700">{message}</p>
              ) : null}
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Live pipeline snapshot</p>
                  <p className="text-2xl font-semibold text-gray-900">{loading ? "Loading…" : `${summary.total} tasks`}</p>
                </div>
                <Badge variant={source === "api" ? "passed" : "warning"}>{source === "api" ? "API live" : "Demo fallback"}</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <MetricCard label="Running" value={summary.running} icon={<PlayCircle className="h-4 w-4" />} tone="blue" />
                <MetricCard label="Passed" value={summary.passed} icon={<ShieldCheck className="h-4 w-4" />} tone="green" />
                <MetricCard label="Needs Review" value={summary.reviewed} icon={<Layers3 className="h-4 w-4" />} tone="amber" />
                <MetricCard label="Tracked" value={summary.total} icon={<ArrowRight className="h-4 w-4" />} tone="gray" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="mb-12 text-3xl font-bold text-gray-900">How it works</h2>
          <div className="grid gap-6 md:grid-cols-5">
            {[
              ["1", "Create Task", "Capture the coding request, repo path, and verification commands."],
              ["2", "Select Context", "Attach the most relevant files so Codex sees the right slice of the repo."],
              ["3", "Execute", "Run the task in a controlled environment with execution logs."],
              ["4", "Verify", "Collect lint and test results so failures are explicit, not hand-waved."],
              ["5", "Review", "Open the task detail page to inspect diff output and next actions."],
            ].map(([number, title, description]) => (
              <div key={number} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-lg font-bold text-white">
                  {number}
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Task preview</h2>
              <p className="mt-2 text-gray-600">
                Inspect the same live task data that powers the board and task detail views.
              </p>
            </div>
            {featuredTask ? (
              <Link href={`/tasks/${featuredTask.id}`}>
                <Button variant="outline" className="gap-2">
                  Open Task Detail
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : null}
          </div>

          {loading ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center text-sm text-gray-500">
              Loading recent task activity…
            </div>
          ) : featuredTask ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <p className="mb-2 text-sm font-medium text-gray-600">Task</p>
                <h3 className="text-2xl font-semibold text-gray-900">{featuredTask.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">{featuredTask.prompt}</p>
                <div className="mt-6 flex items-center gap-3 text-xs text-gray-500">
                  <Badge variant="secondary">{featuredTask.status.replace("_", " ")}</Badge>
                  <span>Updated {formatTaskTimestamp(featuredTask.updatedAt)}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <p className="mb-3 text-sm font-medium text-gray-600">Selected files</p>
                <div className="space-y-2">
                  {featuredTask.selectedFiles.slice(0, 4).map((file) => (
                    <div key={file.path} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <p className="break-all text-xs font-mono text-gray-800">{file.path}</p>
                      {file.score !== null ? <p className="mt-1 text-xs text-gray-500">Relevance {file.score}%</p> : null}
                    </div>
                  ))}
                  {featuredTask.selectedFiles.length === 0 ? (
                    <p className="text-sm text-gray-500">No selected files recorded yet.</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <p className="mb-3 text-sm font-medium text-gray-600">Verification</p>
                <div className="space-y-3">
                  <VerificationRow label="Lint" status={featuredTask.lintStatus} />
                  <VerificationRow label="Tests" status={featuredTask.testStatus} />
                  <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                    <p className="text-2xl font-bold text-violet-700">{featuredTask.score ?? "—"}</p>
                    <p className="text-xs text-violet-700/80">Score</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
              <h3 className="text-xl font-semibold text-gray-900">No tasks yet</h3>
              <p className="mt-2 text-sm text-gray-600">Use the New Task button to create the first CodexFlow run.</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="mb-6 text-3xl font-bold text-gray-900">Ready to run a real task?</h2>
          <p className="mb-8 text-lg text-gray-600">
            Create a task from the navbar, then watch it move from queue to verification on the live board.
          </p>
          <Link href="/board">
            <Button size="lg" className="gap-2">
              Launch Dashboard
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "gray" | "blue" | "green" | "amber";
}) {
  const toneClasses: Record<typeof tone, string> = {
    gray: "border-gray-200 bg-white text-gray-900",
    blue: "border-blue-200 bg-blue-50 text-blue-900",
    green: "border-green-200 bg-green-50 text-green-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneClasses[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <span>{icon}</span>
      </div>
      <p className="mt-4 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function VerificationRow({ label, status }: { label: string; status: string }) {
  const tone =
    status === "passed"
      ? "border-green-200 bg-green-50 text-green-700"
      : status === "failed"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-gray-200 bg-gray-50 text-gray-700";

  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-xs uppercase tracking-wide">{status}</p>
    </div>
  );
}
