'use client';

const statusStyles: Record<string, string> = {
  queued: "bg-muted text-muted-foreground border-border",
  running: "bg-blue-100 text-blue-700 border-blue-200",
  passed: "bg-green-100 text-green-700 border-green-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  needs_review: "bg-amber-100 text-amber-700 border-amber-200",
};

const statusLabels: Record<string, string> = {
  queued: "Queued",
  running: "Running",
  passed: "Passed",
  failed: "Failed",
  needs_review: "Needs Review",
};

interface StatusPillProps { status: string; }

export default function StatusPill({ status }: StatusPillProps) {
  return (
    <span className={`inline-flex items-center rounded-[var(--radius)] border px-2.5 py-0.5 text-xs font-semibold ${statusStyles[status] ?? statusStyles.queued} ${status === "running" ? "status-pulse" : ""}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}
