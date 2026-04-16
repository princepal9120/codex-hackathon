'use client';

import type { TaskRecord } from "@/components/task-api";

interface ScoreCardProps {
  task: TaskRecord;
}

export default function ScoreCard({ task }: ScoreCardProps) {
  const score = task.score ?? 0;
  const percentage = Math.min(Math.max(score, 0), 100);

  const getScoreColor = (s: number) => {
    if (s >= 80) return { bar: "bg-green-500", text: "text-green-700", bg: "bg-green-50", border: "border-green-200" };
    if (s >= 50) return { bar: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" };
    return { bar: "bg-red-500", text: "text-red-700", bg: "bg-red-50", border: "border-red-200" };
  };

  const colors = getScoreColor(score);

  const breakdown = [
    { label: "Patch generated", points: task.diff?.trim() ? 20 : 0, max: 20 },
    { label: "Lint passed", points: task.lintStatus === "passed" ? 30 : 0, max: 30 },
    { label: "Tests passed", points: task.testStatus === "passed" ? 40 : 0, max: 40 },
    { label: "Relevant files", points: task.selectedFiles.length > 0 ? 10 : 0, max: 10 },
  ];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-900/5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-600">
        Score
      </p>
      <h3 className="mt-2 text-lg font-bold text-gray-900">Confidence score</h3>

      <div className="mt-5 flex items-center gap-5">
        <div className={`flex h-20 w-20 items-center justify-center rounded-2xl border ${colors.border} ${colors.bg}`}>
          <span className={`text-3xl font-extrabold ${colors.text}`}>{score}</span>
        </div>
        <div className="flex-1">
          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {score >= 80 ? "High confidence" : score >= 50 ? "Needs review" : "Low confidence"} — {score}/100
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {breakdown.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
            <span className="text-xs text-gray-600">{item.label}</span>
            <span className={`text-xs font-semibold ${item.points > 0 ? "text-green-600" : "text-gray-400"}`}>
              {item.points}/{item.max}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
