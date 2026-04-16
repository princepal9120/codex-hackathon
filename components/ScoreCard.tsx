'use client';

import type { TaskRecord } from "@/components/task-api";

interface ScoreCardProps { task: TaskRecord; }

export default function ScoreCard({ task }: ScoreCardProps) {
  const score = task.score ?? 0;
  const percentage = Math.min(Math.max(score, 0), 100);

  const getColor = (s: number) => {
    if (s >= 80) return { bar: "bg-green-500", text: "text-green-700", bg: "bg-green-50", border: "border-green-200" };
    if (s >= 50) return { bar: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" };
    return { bar: "bg-red-500", text: "text-red-700", bg: "bg-red-50", border: "border-red-200" };
  };

  const c = getColor(score);

  const breakdown = [
    { label: "Patch generated", points: task.diff?.trim() ? 20 : 0, max: 20 },
    { label: "Lint passed", points: task.lintStatus === "passed" ? 30 : 0, max: 30 },
    { label: "Tests passed", points: task.testStatus === "passed" ? 40 : 0, max: 40 },
    { label: "Relevant files", points: task.selectedFiles.length > 0 ? 10 : 0, max: 10 },
  ];

  return (
    <section className="rounded-lg border border-border bg-card p-6 shadow-md">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Score</p>
      <h3 className="mt-2 text-lg font-bold text-foreground">Confidence score</h3>

      <div className="mt-5 flex items-center gap-5">
        <div className={`flex h-20 w-20 items-center justify-center rounded-lg border ${c.border} ${c.bg}`}>
          <span className={`text-3xl font-extrabold ${c.text}`}>{score}</span>
        </div>
        <div className="flex-1">
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full transition-all duration-700 ${c.bar}`} style={{ width: `${percentage}%` }} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{score >= 80 ? "High confidence" : score >= 50 ? "Needs review" : "Low confidence"} — {score}/100</p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {breakdown.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-[var(--radius)] border border-border bg-muted px-3 py-2.5">
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className={`text-xs font-semibold ${item.points > 0 ? "text-green-600" : "text-muted-foreground"}`}>{item.points}/{item.max}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
