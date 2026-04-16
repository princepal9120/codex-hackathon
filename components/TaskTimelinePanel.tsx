'use client';

import { CheckCircle2, AlertCircle, XCircle, Info } from "lucide-react";
import { formatTaskTimestamp, type TaskRecord, type TaskTimelineEvent } from "@/components/task-api";

interface TaskTimelinePanelProps {
  task: TaskRecord;
  maxItems?: number;
  title?: string;
}

export default function TaskTimelinePanel({ task, maxItems = 10, title = "Execution timeline" }: TaskTimelinePanelProps) {
  const events = task.timeline.slice(0, maxItems);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-900/5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-600">
        Timeline
      </p>
      <h3 className="mt-2 text-lg font-bold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">
        Ordered execution events with timestamps and status signals.
      </p>

      {events.length > 0 ? (
        <div className="mt-5 relative">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200" />

          <div className="space-y-4">
            {events.map((event, i) => (
              <TimelineEvent key={event.id || i} event={event} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
          No timeline events yet. Events will populate as the task executes.
        </div>
      )}
    </section>
  );
}

function TimelineEvent({ event }: { event: TaskTimelineEvent }) {
  const iconMap = {
    success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    error: <XCircle className="h-4 w-4 text-red-500" />,
    warning: <AlertCircle className="h-4 w-4 text-amber-500" />,
    info: <Info className="h-4 w-4 text-blue-500" />,
  };

  const bgMap = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-amber-50 border-amber-200",
    info: "bg-blue-50 border-blue-200",
  };

  return (
    <div className="flex gap-3 relative">
      <div className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${bgMap[event.level]}`}>
        {iconMap[event.level]}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900">{event.title}</p>
          <span className="shrink-0 text-[10px] text-gray-400">
            {formatTaskTimestamp(event.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 text-xs leading-5 text-gray-500">{event.detail}</p>
        {event.phase && (
          <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
            {event.phase}
          </span>
        )}
      </div>
    </div>
  );
}
