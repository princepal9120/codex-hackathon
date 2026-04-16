'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Filter, Loader2, Plus, Sparkles } from 'lucide-react';

import { fetchProjects, type ProjectRecord } from '@/components/project-api';
import CreateTaskModal from '@/components/CreateTaskModal';
import TaskColumn from '@/components/TaskColumn';
import {
  fetchTasks,
  getTaskIdentifier,
  getTaskKindLabel,
  type TaskKind,
  type TaskRecord,
  type TaskSource,
  type TaskStatus,
} from '@/components/task-api';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import Shell from '@/components/Shell';

const columnOrder: TaskStatus[] = ['queued', 'running', 'passed', 'failed', 'needs_review'];
const taskKindOptions: TaskKind[] = ['issue', 'task', 'report'];

export default function BoardPage(): JSX.Element {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [source, setSource] = useState<TaskSource>('api');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectFilter, setProjectFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState<'all' | TaskKind>('all');
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [fromOnboarding, setFromOnboarding] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [taskResult, projectResult] = await Promise.all([fetchTasks(), fetchProjects()]);
        if (!active) return;
        setTasks(taskResult.tasks);
        setProjects(projectResult);
        setSource(taskResult.source);
        setMessage(taskResult.message ?? null);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    setCreatedTaskId(params.get('createdTaskId'));
    setFromOnboarding(params.get('from') === 'onboarding');
  }, []);

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        if (Number.isNaN(ta)) return 1;
        if (Number.isNaN(tb)) return -1;
        return tb - ta;
      }),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    return sortedTasks.filter((task) => {
      const matchesProject = projectFilter === 'all' || task.projectId === projectFilter;
      const matchesKind = kindFilter === 'all' || task.taskKind === kindFilter;
      return matchesProject && matchesKind;
    });
  }, [kindFilter, projectFilter, sortedTasks]);

  const createdTask = useMemo(
    () => (createdTaskId ? tasks.find((task) => task.id === createdTaskId) ?? null : null),
    [createdTaskId, tasks]
  );
  let createdTaskMessage: string | null = null;
  if (createdTask) {
    createdTaskMessage = `${createdTask.title} (${getTaskIdentifier(createdTask.id)}) is now on the kanban board.`;
  } else if (createdTaskId) {
    createdTaskMessage = `Your starter work item (${getTaskIdentifier(createdTaskId)}) was created and added to the board.`;
  }
  const createdTaskHref = createdTaskId ? `/tasks/${createdTaskId}` : '/board';
  const isEmptyState = filteredTasks.length === 0 && !message;

  return (
    <Shell>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-background px-6 py-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">Task Board</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {loading ? 'Loading…' : `${filteredTasks.length} work items`} · Kanban view
            {source === 'mock' && ' · Demo data'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Item
          </Button>
        </div>
      </header>

      {message && (
        <div className="border-b border-border bg-muted/50 px-6 py-2.5 text-sm text-muted-foreground">{message}</div>
      )}

      {fromOnboarding && createdTaskId ? (
        <div className="border-b border-emerald-200 bg-emerald-50 px-6 py-3 text-sm text-emerald-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Guided setup complete</p>
              <p className="mt-1">{createdTaskMessage}</p>
            </div>
            <Link href={createdTaskHref}>
              <Button variant="outline" size="sm">
                Open task detail
              </Button>
            </Link>
          </div>
        </div>
      ) : null}

      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="rounded-[var(--radius)] border border-border bg-muted px-3 py-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
          </div>
          <label className="grid gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Project</span>
            <Select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="min-w-[220px]">
              <option value="all">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Item type</span>
            <Select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as 'all' | TaskKind)} className="min-w-[180px]">
              <option value="all">All item types</option>
              {taskKindOptions.map((taskKind) => (
                <option key={taskKind} value={taskKind}>
                  {getTaskKindLabel(taskKind)}
                </option>
              ))}
            </Select>
          </label>
          <div className="rounded-[var(--radius)] border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground">
            Create project-backed issues, implementation tasks, or reports and track them across the shared kanban flow.
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading work items…
          </div>
        ) : isEmptyState ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="rounded-lg border border-dashed border-border bg-card p-10">
              <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <h2 className="mt-4 text-lg font-semibold text-foreground">No board items yet</h2>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                Create your first issue, report, or implementation task to see the project-aware execution board in action.
              </p>
              <Button className="mt-5 gap-2" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Create your first board item
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex h-full gap-4" style={{ minWidth: `${columnOrder.length * 296}px` }}>
            {columnOrder.map((status) => (
              <TaskColumn key={status} status={status} tasks={filteredTasks} />
            ))}
          </div>
        )}
      </div>

      <CreateTaskModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        redirectOnCreate={false}
        onCreated={(task) => {
          setTasks((current) => [task, ...current.filter((existing) => existing.id !== task.id)]);
          setSource('api');
          setMessage(null);
        }}
      />
    </Shell>
  );
}
