'use client';

import { type ReactNode, Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, FolderPlus, Github, Layers, Loader2, Plus, Workflow } from 'lucide-react';

import { connectGitHub, fetchGitHubAuthStatus, fetchRepositories, type GitHubRepository } from '@/components/github-api';
import { createProject, fetchProjects, type ProjectRecord } from '@/components/project-api';
import { formatTaskTimestamp } from '@/components/task-api';
import Shell from '@/components/Shell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

const initialForm = {
  name: '',
  repoPath: '.',
  description: '',
};

type SetupStep = 'unauthenticated' | 'repo-list' | 'configure';

function ProjectsPageContent() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [setupStep, setSetupStep] = useState<SetupStep>('unauthenticated');
  const [repos, setRepos] = useState<GitHubRepository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [githubConfigured, setGitHubConfigured] = useState(true);

  const loadRepositories = async () => {
    setLoadingRepos(true);
    try {
      const data = await fetchRepositories();
      setRepos(data);
    } catch {
      setError("Failed to fetch repositories.");
    } finally {
      setLoadingRepos(false);
    }
  };

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const [nextProjects, authStatus] = await Promise.all([fetchProjects(), fetchGitHubAuthStatus()]);
        if (!active) return;

        setProjects(nextProjects);
        setGitHubConfigured(authStatus.configured);

        if (authStatus.connected) {
          setSetupStep('repo-list');
          await loadRepositories();
        }
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load projects.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const githubError = searchParams.get('github_error');
    const githubConnected = searchParams.get('github_connected');

    if (!githubError && !githubConnected) {
      return;
    }

    if (githubError) {
      setError(githubError);
    } else if (githubConnected) {
      setError(null);
      setSetupStep('repo-list');
      void loadRepositories();
    }

    // Clear params properly using window.history
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('github_error');
      url.searchParams.delete('github_connected');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, [pathname, router, searchParams]);

  const handleConnectGitHub = () => {
    setIsSubmitting(true);
    setError(null);
    connectGitHub();
  };

  const summary = useMemo(() => {
    return {
      totalProjects: projects.length,
      totalTasks: projects.reduce((sum, project) => sum + project.taskCount, 0),
      openTasks: projects.reduce((sum, project) => sum + project.openTaskCount, 0),
    };
  }, [projects]);

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateProject = async () => {
    if (!form.name.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const project = await createProject({
        name: form.name.trim(),
        repoPath: form.repoPath.trim() || '.',
        description: form.description.trim() || undefined,
      });
      setProjects((current) => [project, ...current]);
      setForm(initialForm);
      setSetupStep('repo-list');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Shell>
      <header className="flex items-center justify-between gap-4 border-b border-border bg-background px-6 py-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">Projects</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Create projects so issues, reports, and implementation tasks can be grouped cleanly in the kanban board.</p>
        </div>
        <Button size="sm" className="gap-2" onClick={handleCreateProject} disabled={!form.name.trim() || isSubmitting}>
          <Plus className="h-4 w-4" />
          {isSubmitting ? 'Creating…' : 'New Project'}
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Import Project</p>

            {setupStep === 'unauthenticated' && (
              <div className="mt-2">
                <h2 className="text-xl font-bold text-foreground">Connect Git Provider</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Connect your GitHub account to easily import existing repositories into CodexFlow.
                </p>
                {!githubConfigured && (
                  <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    GitHub OAuth is not configured yet. Add <code className="font-mono text-[12px]">GITHUB_CLIENT_ID</code> and <code className="font-mono text-[12px]">GITHUB_CLIENT_SECRET</code>, then register <code className="font-mono text-[12px]">/api/github/auth/callback</code> as your callback URL.
                  </div>
                )}
                <div className="mt-8">
                  <Button onClick={handleConnectGitHub} disabled={isSubmitting || !githubConfigured} className="w-full sm:w-auto gap-2">
                    <Github className="h-4 w-4" />
                    {isSubmitting ? 'Connecting…' : 'Continue with GitHub'}
                  </Button>
                </div>
              </div>
            )}

            {setupStep === 'repo-list' && (
              <div className="mt-2">
                <h2 className="text-xl font-bold text-foreground">Import Git Repository</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground mr-1">
                  Select a repository to import into your workspace.
                </p>

                <div className="mt-6 divide-y divide-border rounded-[var(--radius)] border border-border">
                  {loadingRepos ? (
                    <div className="flex justify-center p-8 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : repos.map((repo) => (
                    <div key={repo.id} className="flex items-center justify-between p-4 bg-card hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                          <Github className="h-4 w-4" />
                        </div>
                        <div className="grid gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">{repo.name}</span>
                            {repo.private && (
                              <span className="rounded-full border border-border bg-card px-2 py-px text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Private</span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{formatTaskTimestamp(repo.updatedAt)} • {repo.language || 'Unknown'}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setForm({ name: repo.name, repoPath: '.', description: repo.description || '' });
                          setSetupStep('configure');
                        }}
                      >
                        Import
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {setupStep === 'configure' && (
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 mb-4 h-8 gap-1 px-2 text-muted-foreground"
                  onClick={() => setSetupStep('repo-list')}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <h2 className="text-xl font-bold text-foreground">Configure Project</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Review and finalize project settings for <strong>{form.name}</strong>.
                </p>

                <div className="mt-6 space-y-5">
                  <Field label="Project name" helper="Used everywhere in the board and detail surfaces.">
                    <Input value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Runtime reliability" />
                  </Field>
                  <Field label="Repository path" helper="Must stay inside the configured repository root.">
                    <Input value={form.repoPath} onChange={(event) => updateField('repoPath', event.target.value)} placeholder="." />
                  </Field>
                  <Field label="Description" helper="Optional context for operators and reviewers.">
                    <Textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Track issues, reports, and implementation work for runtime and sandbox reliability." />
                  </Field>
                  <Button className="w-full sm:w-auto mt-2" onClick={handleCreateProject} disabled={!form.name.trim() || isSubmitting}>
                    {isSubmitting ? 'Importing…' : 'Import Project'}
                  </Button>
                </div>
              </div>
            )}

            {error ? (
              <div className="mt-5 rounded-[var(--radius)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <SummaryTile label="Projects" value={String(summary.totalProjects)} />
              <SummaryTile label="Board items" value={String(summary.totalTasks)} />
              <SummaryTile label="Open work" value={String(summary.openTasks)} />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Workspace map</p>
                <h2 className="mt-2 text-xl font-bold text-foreground">Project inventory</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Every project below can receive issue, task, and report work items from the shared create-work modal.</p>
              </div>
              <div className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                {loading ? 'Loading…' : `${projects.length} projects`}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {loading ? (
                <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading projects…
                </div>
              ) : projects.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-6 text-center">
                  <FolderPlus className="h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-4 text-base font-semibold text-foreground">No projects yet</p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Create your first project to start grouping issues, reports, and implementation tasks inside the kanban board.</p>
                </div>
              ) : (
                projects.map((project) => <ProjectCard key={project.id} project={project} />)
              )}
            </div>
          </section>
        </div>
      </div>
    </Shell>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <Shell>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Shell>
    }>
      <ProjectsPageContent />
    </Suspense>
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

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-muted px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectRecord }) {
  return (
    <article className="rounded-lg border border-border bg-muted/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{project.slug}</span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">{project.openTaskCount} open</span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-foreground">{project.name}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.description || 'No description yet. Create issues, reports, and tasks from the board modal.'}</p>
        </div>
        <div className="grid min-w-[180px] gap-2 sm:grid-cols-2">
          <Stat icon={<Workflow className="h-4 w-4" />} label="Items" value={String(project.taskCount)} />
          <Stat icon={<Layers className="h-4 w-4" />} label="Repo" value={project.repoPath} mono />
        </div>
      </div>
    </article>
  );
}

function Stat({ icon, label, value, mono = false }: { icon: ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-card px-3 py-2.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className={`mt-2 text-sm font-semibold text-foreground ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
