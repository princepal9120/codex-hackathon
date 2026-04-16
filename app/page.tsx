'use client';

import { type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Github, SearchCode, ShieldCheck, Sparkles, Workflow } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import SurfaceCard from "@/components/SurfaceCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchTasks, formatTaskTimestamp, getConfidenceLabel, type TaskRecord, type TaskSource } from "@/components/task-api";

export default function LandingPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [source, setSource] = useState<TaskSource>("api");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const result = await fetchTasks();
      if (!active) return;
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
    <main className="mx-auto max-w-7xl px-6 py-8 pb-16">
      <PageHeader
        eyebrow="Repo-aware execution"
        title="Make AI coding runs feel trustworthy"
        description="CodexFlow turns a request into a clear review flow: rank repository context, build a prompt preview, capture a patch artifact, and verify before anyone trusts the result."
        badge={source === "api" ? "Live pipeline" : "Demo fallback"}
        actions={
          <>
            <Link href="/board">
              <Button className="gap-2">
                Open task board
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <Github className="h-4 w-4" />
                View GitHub
              </Button>
            </a>
          </>
        }
        meta={[
          { label: "Tracked tasks", value: loading ? "Loading…" : String(summary.total) },
          { label: "Running", value: String(summary.running) },
          { label: "Passed", value: String(summary.passed) },
          { label: "Needs review", value: String(summary.reviewed) },
        ]}
      />

      {message ? <div className="mt-6 rounded-[22px] border border-[#ead7b9] bg-[#fff6e8] px-4 py-3 text-sm text-[#9a6a22]">{message}</div> : null}

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <SurfaceCard
          eyebrow="How it works"
          title="A serious review path, not a magic black box"
          description="Keep the scope tight: intake, repo-aware context, execution visibility, verification evidence, and one confidence signal."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StepCard icon={<Workflow className="h-5 w-5 text-[#0f766e]" />} title="Capture request" description="Title, prompt, repository path, and verification commands." />
            <StepCard icon={<SearchCode className="h-5 w-5 text-[#0f766e]" />} title="Rank context" description="Select the most relevant files and explain why they matter." />
            <StepCard icon={<Sparkles className="h-5 w-5 text-[#0f766e]" />} title="Generate patch" description="Build a prompt preview and capture the diff as the artifact." />
            <StepCard icon={<ShieldCheck className="h-5 w-5 text-[#0f766e]" />} title="Verify trust" description="Record lint, tests, notes, logs, and a score before trust." />
          </div>
        </SurfaceCard>

        <SurfaceCard
          eyebrow="Live signal"
          title="Featured task"
          description="The same task record powers the board, task detail, prompt preview, and verification evidence."
        >
          {loading ? (
            <div className="rounded-[22px] border border-dashed border-[#e5ddd2] bg-white/70 px-5 py-14 text-center text-sm text-[#7e7569]">
              Loading recent task activity…
            </div>
          ) : featuredTask ? (
            <div className="rounded-[24px] border border-[#e7ded2] bg-white p-5 shadow-[0_12px_28px_rgba(31,24,18,0.05)]">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary">{featuredTask.status.replace("_", " ")}</Badge>
                <span className="text-xs text-[#867d72]">Updated {formatTaskTimestamp(featuredTask.updatedAt)}</span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[#1f1c17]">{featuredTask.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#6f675d]">{featuredTask.contextSummary || featuredTask.prompt}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <SignalTile label="Selected files" value={String(featuredTask.selectedFiles.length)} helper="Ranked context bundle" />
                <SignalTile label="Confidence" value={getConfidenceLabel(featuredTask.score)} helper={featuredTask.score !== null ? `${featuredTask.score}/100 score` : "Awaiting score"} />
              </div>
              <div className="mt-5">
                <Link href={`/tasks/${featuredTask.id}`}>
                  <Button variant="outline" className="gap-2">
                    Open task detail
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-[#e5ddd2] bg-white/70 px-5 py-14 text-center text-sm text-[#7e7569]">
              No tasks yet. Create one from the navigation bar to start the pipeline.
            </div>
          )}
        </SurfaceCard>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <SurfaceCard eyebrow="Context" title="Selected-file rationale" description="Surface why the system chose each file instead of hiding the context bundle behind the scenes.">
          <p className="text-sm leading-6 text-[#6f675d]">
            CodexFlow keeps the differentiator front and center: selected file paths, matching terms, rationale, and snippets that justify the patch preview.
          </p>
        </SurfaceCard>
        <SurfaceCard eyebrow="Review artifact" title="Prompt + diff preview" description="Treat the prompt preview and patch as explicit review artifacts rather than hidden implementation details.">
          <p className="text-sm leading-6 text-[#6f675d]">
            Every run exposes the generated prompt, context summary, patch summary, and raw diff so reviewers can audit the reasoning chain.
          </p>
        </SurfaceCard>
        <SurfaceCard eyebrow="Verification" title="Trust backed by evidence" description="A run only becomes credible when lint, tests, notes, and logs all line up.">
          <p className="text-sm leading-6 text-[#6f675d]">
            Verification output is preserved alongside the task, so failures are visible and successful runs stay proof-oriented instead of hand-wavy.
          </p>
        </SurfaceCard>
      </section>
    </main>
  );
}

function StepCard({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-[22px] border border-[#e8dfd3] bg-white px-4 py-4 shadow-[0_8px_22px_rgba(31,24,18,0.04)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf8f6]">{icon}</div>
      <h3 className="mt-4 text-base font-semibold text-[#1f1c17]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#6f675d]">{description}</p>
    </div>
  );
}

function SignalTile({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[20px] border border-[#ece4d8] bg-[#faf6f0] px-4 py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8b8378]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[#1f1c17]">{value}</p>
      <p className="mt-1 text-xs text-[#857d72]">{helper}</p>
    </div>
  );
}
