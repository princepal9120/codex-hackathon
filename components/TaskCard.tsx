import Link from 'next/link';
import { CheckCircle2, Clock3, Files, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable';
import type { AnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
  formatTaskTimestamp,
  getConfidenceLabel,
  getTaskIdentifier,
  getTaskKindLabel,
  type TaskRecord,
} from '@/components/task-api';

interface TaskCardProps {
  task: TaskRecord;
  isSelected?: boolean;
  onSelect?: (task: TaskRecord) => void;
  isOverlay?: boolean;
}

const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args;
  if (isSorting || wasDragging) return false;
  return defaultAnimateLayoutChanges(args);
};

export default function TaskCard({ task, isSelected = false, onSelect, isOverlay = false }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { status: task.status },
    animateLayoutChanges,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Add zIndex if dragging so it pops out
    zIndex: isDragging ? 100 : undefined,
  };

  const verificationLabel =
    task.lintStatus === 'failed' || task.testStatus === 'failed'
      ? 'Verify failed'
      : task.lintStatus === 'passed' && task.testStatus === 'passed'
        ? 'Verified'
        : 'Pending';

  const VerificationIcon =
    task.lintStatus === 'failed' || task.testStatus === 'failed'
      ? ShieldAlert
      : task.lintStatus === 'passed' && task.testStatus === 'passed'
        ? CheckCircle2
        : Clock3;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group block select-none touch-manipulation',
        isDragging && !isOverlay ? 'opacity-30' : 'opacity-100',
        isOverlay ? 'cursor-grabbing' : 'cursor-grab'
      )}
    >
      <article className={cn(
        'rounded-lg border border-border bg-card p-4 shadow-xs transition-shadow duration-150 hover:border-ring/30 hover:shadow-md',
        isSelected && 'border-primary/40 ring-2 ring-primary/15',
        isOverlay && 'shadow-lg shadow-black/10'
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{getTaskIdentifier(task.id)}</p>
              <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-foreground">
                {getTaskKindLabel(task.taskKind)}
              </span>
            </div>
            <h3 className="mt-1.5 line-clamp-2 text-[14px] font-semibold leading-5 text-foreground">{task.title}</h3>
          </div>
          {task.score !== null && (
            <span className="shrink-0 rounded-[var(--radius)] bg-secondary px-2 py-0.5 text-[11px] font-semibold tabular-nums text-secondary-foreground">
              {task.score}
            </span>
          )}
        </div>

        {task.projectName && (
          <p className="mt-2 text-[11px] font-medium text-primary">{task.projectName}</p>
        )}

        <p className="mt-2 line-clamp-2 text-[12px] leading-[18px] text-muted-foreground">
          {task.contextSummary || task.prompt}
        </p>

        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          {task.selectedFiles.length > 0 && (
            <>
              <span className="inline-flex items-center gap-1">
                <Files className="h-3 w-3" />
                {task.selectedFiles.length}
              </span>
              <span className="text-border">·</span>
            </>
          )}
          <span className="inline-flex items-center gap-1">
            <VerificationIcon className="h-3 w-3" />
            {verificationLabel}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
          <span className="text-[11px] font-medium text-foreground">{getConfidenceLabel(task.score)}</span>
          <div className="flex items-center gap-2">
            <span className={cn('inline-flex h-1.5 w-1.5 rounded-full', task.status === 'running' ? 'status-pulse bg-blue-500' : task.status === 'passed' ? 'bg-green-500' : task.status === 'failed' ? 'bg-red-500' : task.status === 'needs_review' ? 'bg-amber-500' : 'bg-muted-foreground')} />
            <span className="text-[11px] text-muted-foreground">{formatTaskTimestamp(task.updatedAt)}</span>
          </div>
        </div>
      </article>
    </div>
  );
}

