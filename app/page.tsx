'use client';

import { type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  FileSearch,
  Github,
  GitPullRequest,
  Layers,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  Workflow,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  fetchTasks,
  formatTaskTimestamp,
  getConfidenceLabel,
  type TaskRecord,
  type TaskSource,
} from "@/components/task-api";
import OnboardingModal from "@/components/OnboardingModal";

export default function LandingPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [source, setSource] = useState<TaskSource>("api");
  const [loading, setLoading] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const result = await fetchTasks();
      if (!active) return;
      setTasks(result.tasks);
      setSource(result.source);
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  const summary = useMemo(() => ({
    total: tasks.length,
    passed: tasks.filter((t) => t.status === "passed").length,
    running: tasks.filter((t) => t.status === "running").length,
    failed: tasks.filter((t) => t.status === "failed").length,
  }), [tasks]);

  const featuredTask = useMemo(
    () => tasks.find((t) => t.diff || t.selectedFiles.length > 0) ?? tasks[0] ?? null,
    [tasks]
  );

  return (
    <main className="landing-hero-bg min-h-screen">
      <div className="relative z-10">
        {/* ── Hero ── */}
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 text-center">
          <div className="fade-up opacity-0">
            <div className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-border bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Repo-aware AI execution
            </div>
          </div>

          <h1 className="fade-up fade-up-delay-1 opacity-0 mx-auto mt-8 max-w-4xl text-5xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Make Codex work on{" "}
            <span className="text-primary">real codebases</span>
          </h1>

          <p className="fade-up fade-up-delay-2 opacity-0 mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            CodexFlow turns coding tasks into an execution pipeline. It selects
            the right repo context, runs Codex on the task, verifies the output
            with lint and tests, and tracks the result in a simple board.
          </p>

          <div className="fade-up fade-up-delay-3 opacity-0 mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={() => setIsOnboardingOpen(true)}
              className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-6 text-base font-semibold"
            >
              <Github className="h-4 w-4" />
              Onboard Project
            </Button>
            <Link href="/board">
              <Button variant="outline" className="h-12 gap-2 px-6 text-base font-semibold">
                View Demo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="fade-up fade-up-delay-4 opacity-0 mx-auto mt-16 grid max-w-2xl grid-cols-4 gap-6 rounded-lg border border-border bg-card p-6 shadow-lg">
            <StatPill label="Total tasks" value={loading ? "…" : String(summary.total)} />
            <StatPill label="Running" value={String(summary.running)} />
            <StatPill label="Passed" value={String(summary.passed)} />
            <StatPill label="Failed" value={String(summary.failed)} />
          </div>
        </section>

        {/* ── Problem ── */}
        <section className="border-t border-border bg-secondary/50">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-primary">The problem</p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Coding agents fail on real repos
                </h2>
                <p className="mt-6 text-lg leading-8 text-muted-foreground">
                  They get the wrong context and produce unverified output. Without
                  proper file selection, prompt construction, and test verification,
                  AI-generated patches are unreliable.
                </p>
                <div className="mt-8 space-y-4">
                  <ProblemPoint icon={<FileSearch className="h-5 w-5 text-destructive" />} title="Wrong file context" desc="Models hallucinate when given irrelevant files or miss critical dependencies." />
                  <ProblemPoint icon={<Terminal className="h-5 w-5 text-destructive" />} title="Unverified output" desc="Generated patches often break lint, tests, or introduce regressions." />
                  <ProblemPoint icon={<Layers className="h-5 w-5 text-destructive" />} title="No audit trail" desc="No visibility into what context was used, what prompt was sent, or why it failed." />
                </div>
              </div>
              <div className="relative">
                <div className="rounded-lg border border-border bg-card p-8 shadow-xl">
                  <div className="flex items-center gap-2 border-b border-border pb-4">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                    <span className="ml-2 text-xs font-medium text-muted-foreground">typical AI coding workflow</span>
                  </div>
                  <div className="mt-4 space-y-3 font-mono text-sm">
                    <p className="text-muted-foreground">$ codex run &quot;add rate limiting&quot;</p>
                    <p className="text-amber-600">⚠ No file context selected</p>
                    <p className="text-amber-600">⚠ Guessing relevant files...</p>
                    <p className="text-red-500">✗ Generated patch breaks 4 tests</p>
                    <p className="text-red-500">✗ Lint errors in 2 files</p>
                    <p className="text-muted-foreground mt-4">No verification. No audit trail.</p>
                    <p className="text-destructive font-semibold mt-2">Result: Broken code merged blind.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">How it works</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                A serious review path, not a magic black box
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Five clear steps from task creation to verified result.
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
              <StepCard number={1} icon={<Play className="h-5 w-5" />} title="Create task" description="Define the coding task with a prompt, repo path, and verification commands." />
              <StepCard number={2} icon={<Search className="h-5 w-5" />} title="Select files" description="Scan and rank repository files by relevance to build the right context." />
              <StepCard number={3} icon={<Code2 className="h-5 w-5" />} title="Execute" description="Build a prompt preview and generate a patch with Codex." />
              <StepCard number={4} icon={<ShieldCheck className="h-5 w-5" />} title="Verify" description="Run lint and tests against the generated patch automatically." />
              <StepCard number={5} icon={<CheckCircle2 className="h-5 w-5" />} title="Review" description="Inspect diff, logs, score, and verification evidence before trust." />
            </div>
          </div>
        </section>

        {/* ── Demo Preview ── */}
        <section className="border-t border-border bg-secondary/50">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">Live preview</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">See it in action</h2>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-lg border border-border bg-card p-6 shadow-lg">
                {loading ? (
                  <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading task data…</div>
                ) : featuredTask ? (
                  <div>
                    <div className="flex items-center gap-3">
                      <StatusBadgeInline status={featuredTask.status} />
                      <span className="text-xs text-muted-foreground">Updated {formatTaskTimestamp(featuredTask.updatedAt)}</span>
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-foreground">{featuredTask.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{featuredTask.contextSummary || featuredTask.prompt}</p>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <MetricCard label="Selected files" value={String(featuredTask.selectedFiles.length)} sub="Ranked context bundle" />
                      <MetricCard label="Confidence" value={getConfidenceLabel(featuredTask.score)} sub={featuredTask.score !== null ? `${featuredTask.score}/100 score` : "Awaiting score"} />
                    </div>

                    {featuredTask.diff && (
                      <div className="mt-6 rounded-[var(--radius)] border border-border bg-muted p-4">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Patch preview</p>
                        <pre className="overflow-hidden text-xs font-mono leading-5">
                          {featuredTask.diff.split("\n").slice(0, 8).map((line: string, i: number) => (
                            <span key={i} className={`block px-2 rounded ${line.startsWith("+") ? "diff-add" : line.startsWith("-") ? "diff-remove" : line.startsWith("@@") ? "diff-header" : "text-muted-foreground"}`}>
                              {line}
                            </span>
                          ))}
                        </pre>
                      </div>
                    )}

                    <div className="mt-6">
                      <Link href={`/tasks/${featuredTask.id}`}>
                        <Button variant="outline" className="gap-2">Open task detail <ArrowRight className="h-4 w-4" /></Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center text-center">
                    <Sparkles className="h-10 w-10 text-muted-foreground/30" />
                    <p className="mt-3 text-sm text-muted-foreground">No tasks yet. Create one from the board to start.</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <FeatureCard icon={<FileSearch className="h-5 w-5 text-primary" />} title="Selected-file rationale" description="Surface why the system chose each file instead of hiding the context bundle." />
                <FeatureCard icon={<GitPullRequest className="h-5 w-5 text-primary" />} title="Prompt + diff preview" description="Every run exposes the generated prompt, context summary, and raw diff." />
                <FeatureCard icon={<ShieldCheck className="h-5 w-5 text-primary" />} title="Trust backed by evidence" description="Verification output is preserved. Failures are visible and runs stay proof-oriented." />
                <FeatureCard icon={<Workflow className="h-5 w-5 text-primary" />} title="Execution timeline" description="Track every step with timestamps and status signals." />
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-4xl px-6 py-20 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Ready to see CodexFlow in action?</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">Open the board, create a task, and watch the pipeline execute with full visibility.</p>
            <div className="mt-8">
              <Link href="/board">
                <Button className="h-12 gap-2 px-8 text-base font-semibold">Open Task Board <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">{source === "api" ? "Connected to live pipeline" : "API unavailable — demo data"} · {tasks.length} tasks tracked</p>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-border bg-card">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">CF</div>
              <span className="text-sm font-semibold text-foreground">CodexFlow</span>
            </div>
            <p className="text-xs text-muted-foreground">AI task execution pipeline</p>
          </div>
        </footer>
      </div>
      <OnboardingModal open={isOnboardingOpen} onOpenChange={setIsOnboardingOpen} />
    </main>
  );
}

/* ── Sub-components ── */

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ProblemPoint({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">{icon}</div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function StepCard({ number, icon, title, description }: { number: number; icon: ReactNode; title: string; description: string }) {
  return (
    <div className="group relative rounded-lg border border-border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/30">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary transition-colors group-hover:bg-accent">
        {icon}
      </div>
      <div className="absolute right-4 top-4 text-xs font-bold text-muted-foreground/40">{String(number).padStart(2, "0")}</div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-muted px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="hover-lift rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">{icon}</div>
        <div>
          <h4 className="font-semibold text-foreground">{title}</h4>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadgeInline({ status }: { status: string }) {
  const styles: Record<string, string> = {
    passed: "bg-green-100 text-green-700 border-green-200",
    running: "bg-blue-100 text-blue-700 border-blue-200",
    failed: "bg-red-100 text-red-700 border-red-200",
    needs_review: "bg-amber-100 text-amber-700 border-amber-200",
    queued: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center rounded-[var(--radius)] border px-2.5 py-0.5 text-xs font-semibold ${styles[status] ?? styles.queued}`}>
      {status === "needs_review" ? "Needs Review" : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
