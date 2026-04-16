'use client';

import Link from 'next/link';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, FileSearch, Search, ShieldCheck } from 'lucide-react';

import { fetchProjects, type ProjectRecord } from '@/components/project-api';
import { createTask, getTaskKindLabel, type TaskKind, type TaskRecord } from '@/components/task-api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (task: TaskRecord) => void;
  redirectOnCreate?: boolean;
}

const initialForm = {
  title: '',
  prompt: '',
  projectId: '',
  taskKind: 'issue' as TaskKind,
  repoPath: '.',
  lintCommand: 'npm run lint',
  testCommand: 'python3 -m unittest discover -s tests',
};

const taskKindOptions: TaskKind[] = ['issue', 'task', 'report'];

export default function CreateTaskModal({
  open,
  onOpenChange,
  onCreated,
  redirectOnCreate = true,
}: CreateTaskModalProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;
    setProjectsLoading(true);
    void fetchProjects()
      .then((nextProjects) => {
        if (!active) return;
        setProjects(nextProjects);
        setForm((current) => ({
          ...current,
          projectId: current.projectId || nextProjects[0]?.id || '',
        }));
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load projects.');
      })
      .finally(() => {
        if (active) setProjectsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open]);

  const isValid = useMemo(() => form.title.trim().length > 0 && form.prompt.trim().length > 0, [form.prompt, form.title]);

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const reset = () => {
    setForm((_prev) => ({ ...initialForm, projectId: projects[0]?.id || '' }));
    setError(null);
    setIsSubmitting(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isSubmitting) {
      reset();
    }
    onOpenChange(nextOpen);
  };

  const handleCreate = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const task = await createTask({
        title: form.title.trim(),
        prompt: form.prompt.trim(),
        projectId: form.projectId || undefined,
        taskKind: form.taskKind,
        repoPath: form.repoPath.trim() || '.',
        lintCommand: form.lintCommand.trim() || undefined,
        testCommand: form.testCommand.trim() || undefined,
      });
      onCreated?.(task);
      reset();
      onOpenChange(false);
      if (redirectOnCreate) {
        router.push(`/tasks/${task.id}`);
        router.refresh();
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create task.');
      setIsSubmitting(false);
    }
  };

  const promptWords = form.prompt.trim().split(/\s+/).filter(Boolean).length;
  const selectedProject = projects.find((project) => project.id === form.projectId) ?? null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a project-backed work item</DialogTitle>
          <DialogDescription>
            Create an issue, implementation task, or report. Every item lands in the kanban board with repo-aware context and verification.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto pr-1">
          <div className="grid gap-6 py-1 lg:grid-cols-[1.35fr_0.8fr]">
            <div className="space-y-5">
              <section className="rounded-[var(--radius)] border border-border bg-muted p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Work item</p>
                <h3 className="mt-2 text-lg font-bold text-foreground">Create the issue, task, or report</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Strong prompts make the file ranking, patch preview, and verification trail much more trustworthy.
                </p>

                <div className="mt-4 grid gap-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Project" helper="Use an existing project so the board stays organized.">
                      <Select value={form.projectId} onChange={(event) => updateField('projectId', event.target.value)} disabled={projectsLoading || projects.length === 0}>
                        {projects.length === 0 ? (
                          <option value="">No projects yet</option>
                        ) : (
                          projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))
                        )}
                      </Select>
                    </Field>
                    <Field label="Type" helper="Issues are great for bugs, reports for summaries, and tasks for implementation work.">
                      <Select value={form.taskKind} onChange={(event) => updateField('taskKind', event.target.value)}>
                        {taskKindOptions.map((taskKind) => (
                          <option key={taskKind} value={taskKind}>
                            {getTaskKindLabel(taskKind)}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>

                  <Field label="Title" helper="Short summary used on the board and detail page.">
                    <Input id="task-title" type="text" placeholder="Create an issue for kanban assignment flow" value={form.title} onChange={(event) => updateField('title', event.target.value)} />
                  </Field>
                  <Field label="Prompt" helper="Describe the expected behavior and constraints.">
                    <Textarea
                      id="task-prompt"
                      placeholder="Improve the project-aware issue and report flow. Keep the patch preview primary, preserve verification, and make the board feel operational."
                      value={form.prompt}
                      onChange={(event) => updateField('prompt', event.target.value)}
                    />
                  </Field>
                </div>
              </section>

              <section className="rounded-[var(--radius)] border border-border bg-muted p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Execution settings</p>
                <h3 className="mt-2 text-lg font-bold text-foreground">Control repo scope and verification</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">These values tell CodexFlow where to scan and which commands prove the patch.</p>

                <div className="mt-4 grid gap-5">
                  <Field label="Repository path" helper="Relative path used by the scanner.">
                    <Input id="task-repo-path" type="text" placeholder="." value={form.repoPath} onChange={(event) => updateField('repoPath', event.target.value)} />
                  </Field>
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Lint command" helper="From codexflow.config.json.">
                      <Input id="task-lint-command" type="text" placeholder="npm run lint" value={form.lintCommand} readOnly />
                    </Field>
                    <Field label="Test command" helper="From codexflow.config.json.">
                      <Input id="task-test-command" type="text" placeholder="npm test" value={form.testCommand} readOnly />
                    </Field>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <section className="rounded-[var(--radius)] border border-border bg-card p-5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Run summary</p>
                <div className="mt-4 grid gap-3">
                  <SummaryStat label="Item type" value={getTaskKindLabel(form.taskKind)} />
                  <SummaryStat label="Prompt words" value={String(promptWords)} />
                  <SummaryStat label="Project" value={selectedProject?.name || (projectsLoading ? 'Loading…' : 'Unassigned')} />
                  <SummaryStat label="Repo target" value={form.repoPath.trim() || '.'} mono />
                  <SummaryStat label="Verification" value={form.lintCommand.trim() && form.testCommand.trim() ? 'Lint + tests' : 'Partial'} />
                </div>
              </section>

              <section className="rounded-[var(--radius)] border border-border bg-muted p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Pipeline</p>
                <div className="mt-4 space-y-2">
                  <PipelineRow icon={<FileSearch className="h-4 w-4 text-primary" />} title="Rank relevant files" helper="Scan and assemble the context bundle." />
                  <PipelineRow icon={<Search className="h-4 w-4 text-primary" />} title="Build prompt preview" helper="Capture the exact prompt and rationale." />
                  <PipelineRow icon={<ShieldCheck className="h-4 w-4 text-primary" />} title="Verify before trust" helper="Record lint, tests, logs, and score." />
                </div>
              </section>

              <div className="rounded-[var(--radius)] border border-border bg-secondary px-4 py-3 text-sm text-secondary-foreground">
                Need a project first?{' '}
                <Link href="/projects" className="font-semibold underline-offset-4 hover:underline">
                  Create one from the Projects page.
                </Link>
              </div>

              {error ? (
                <div className="rounded-[var(--radius)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              ) : null}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!isValid || isSubmitting || projectsLoading} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {isSubmitting ? 'Creating…' : `Create ${getTaskKindLabel(form.taskKind)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, helper, children }: { label: string; helper: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{helper}</p>
      </div>
      {children}
    </label>
  );
}

function SummaryStat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-muted px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-medium text-foreground ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

function PipelineRow({ icon, title, helper }: { icon: ReactNode; title: string; helper: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-card px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary">{icon}</div>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{helper}</p>
        </div>
      </div>
    </div>
  );
}
