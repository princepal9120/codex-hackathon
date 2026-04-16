import { AlertTriangle, CheckCircle2, Clock3, GitBranch, ListChecks, PlayCircle, type LucideIcon } from "lucide-react";

import {
  formatTaskTimestamp,
  getFailureClassificationLabel,
  type TaskRecord,
  type TaskTimelineEvent,
  type TaskTimelineEventKind,
} from "@/components/task-api";

interface TaskTimelinePanelProps {
  task: TaskRecord;
  maxItems?: number;
  title?: string;
  compact?: boolean;
}

const eventStyles: Record<
  TaskTimelineEventKind,
  { icon: LucideIcon; tone: string; iconTone: string }
> = {
  task: {
    icon: GitBranch,
    tone: "border-gray-200 bg-gray-50",
    iconTone: "text-gray-500",
  },
  context: {
    icon: GitBranch,
    tone: "border-violet-200 bg-violet-50",
    iconTone: "text-violet-600",
  },
  execution: {
    icon: PlayCircle,
    tone: "border-blue-200 bg-blue-50",
    iconTone: "text-blue-600",
  },
  verification: {
    icon: ListChecks,
    tone: "border-green-200 bg-green-50",
    iconTone: "text-green-600",
  },
  failure: {
    icon: AlertTriangle,
    tone: "border-red-200 bg-red-50",
    iconTone: "text-red-600",
  },
  system: {
    icon: Clock3,
    tone: "border-gray-200 bg-white",
    iconTone: "text-gray-400",
  },
};

function sortTimeline(events: TaskTimelineEvent[]) {
  return [...events].sort((left, right) => {
    const leftTime = left.createdAt ? Date.parse(left.createdAt) : Number.NaN;
    const rightTime = right.createdAt ? Date.parse(right.createdAt) : Number.NaN;

    if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
      return 0;
    }

    return rightTime - leftTime;
  });
}

export default function TaskTimelinePanel({
  task,
  maxItems = 6,
  title = "Execution Timeline",
  compact = false,
}: TaskTimelinePanelProps) {
  const timeline = sortTimeline(task.timeline).slice(0, maxItems);

  if (timeline.length === 0 && !task.failureSignal) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <span className="text-xs text-gray-500">{timeline.length} events</span>
        </div>
      </div>

      {task.failureSignal ? (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-900">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
              {getFailureClassificationLabel(task.failureSignal.classification)}
            </span>
            <p className="font-medium">{task.failureSignal.summary}</p>
          </div>
          {task.failureSignal.detail ? <p className="mt-2 text-amber-900/80">{task.failureSignal.detail}</p> : null}
          {task.failureSignal.action ? <p className="mt-2 text-xs text-amber-900/80">Next step: {task.failureSignal.action}</p> : null}
        </div>
      ) : null}

      <div className="space-y-3 px-6 py-5">
        {timeline.map((event) => {
          const style = eventStyles[event.kind];
          const Icon = style.icon;

          return (
            <div key={event.id} className={`rounded-2xl border px-4 py-4 ${style.tone}`}>
              <div className={`mb-3 flex items-center gap-3 ${compact ? "mb-2" : ""}`}>
                <Icon className={`h-4 w-4 shrink-0 ${style.iconTone}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{event.label}</p>
                    {event.status ? (
                      <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                        {event.status.replace("_", " ")}
                      </span>
                    ) : null}
                    {event.kind === "verification" && task.status === "passed" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : null}
                  </div>
                  {event.detail ? (
                    <p className={`mt-1 text-sm text-gray-600 ${compact ? "line-clamp-2" : ""}`}>{event.detail}</p>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-gray-500">{formatTaskTimestamp(event.createdAt ?? task.updatedAt)}</p>
                  {event.source ? <p className="mt-1 text-[11px] uppercase tracking-wide text-gray-400">{event.source}</p> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
