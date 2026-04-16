'use client';

const styles: Record<string, string> = {
  queued: "bg-gray-100 text-gray-600",
  running: "bg-blue-100 text-blue-700",
  passed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  needs_review: "bg-amber-100 text-amber-700",
};

export function StatusBadge({ status }: { status: string }) {
  const label = status === "needs_review" ? "Needs Review" : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] ?? styles.queued}`}>
      {label}
    </span>
  );
}
