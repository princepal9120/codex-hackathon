'use client';

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FolderGit2,
  GitBranch,
  Github,
  Globe,
  Loader2,
  Lock,
  Plug2,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Unplug,
} from "lucide-react";

import {
  createProject,
  disconnectGitHub,
  fetchGitHubRepositories,
  fetchGitHubStatus,
  fetchProjects,
  type GitHubConnectionStatus,
  type GitHubRepositoryRecord,
  type ProjectRecord,
} from "@/components/project-api";
import { formatTaskTimestamp } from "@/components/task-api";
import Shell from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";

type View = "inventory" | "import" | "configure";
type FeedbackTone = "success" | "error" | "info";

interface FeedbackState {
  tone: FeedbackTone;
  message: string;
}

const emptyGitHubStatus: GitHubConnectionStatus = {
  configured: false,
  connected: false,
  connection: null,
};

const initialConfig = {
  name: "",
  repoPath: ".",
  description: "",
};

export default function ProjectsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [view, setView] = useState<View>("inventory");
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [githubStatus, setGithubStatus] =
    useState<GitHubConnectionStatus>(emptyGitHubStatus);
  const [statusLoading, setStatusLoading] = useState(true);
  const [repos, setRepos] = useState<GitHubRepositoryRecord[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepositoryRecord | null>(null);
  const [config, setConfig] = useState(initialConfig);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void Promise.all([loadProjects(), loadGitHubStatus()]);
  }, []);

  useEffect(() => {
    const status = searchParams.get("github");
    const message = searchParams.get("message");

    if (!status) {
      return;
    }

    if (status === "connected") {
      setFeedback({
        tone: "success",
        message: "GitHub connected. Select a repository to import into Projects.",
      });
      setView("import");
      void Promise.all([loadGitHubStatus(), loadGitHubRepos()]);
    } else if (status === "missing-config") {
      setFeedback({
        tone: "error",
        message:
          "GitHub OAuth is not configured yet. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET before connecting.",
      });
    } else if (status === "failed") {
      setFeedback({
        tone: "error",
        message: message || "GitHub authorization failed. Please try connecting again.",
      });
    }

    router.replace("/projects");
  }, [router, searchParams]);

  useEffect(() => {
    if (view === "import" && githubStatus.connected && repos.length === 0 && !reposLoading) {
      void loadGitHubRepos();
    }
  }, [githubStatus.connected, repos.length, reposLoading, view]);

  const filteredRepos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return repos;
    }

    return repos.filter((repo) =>
      `${repo.fullName} ${repo.language || ""} ${repo.description || ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [repos, searchQuery]);

  async function loadProjects() {
    setProjectsLoading(true);

    try {
      setProjects(await fetchProjects());
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Failed to load projects.",
      });
    } finally {
      setProjectsLoading(false);
    }
  }

  async function loadGitHubStatus() {
    setStatusLoading(true);

    try {
      setGithubStatus(await fetchGitHubStatus());
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to load GitHub connection status.",
      });
    } finally {
      setStatusLoading(false);
    }
  }

  async function loadGitHubRepos() {
    setReposLoading(true);

    try {
      setRepos(await fetchGitHubRepositories());
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to load GitHub repositories.",
      });
    } finally {
      setReposLoading(false);
    }
  }

  function resetImportFlow(nextView: View = "inventory") {
    setSelectedRepo(null);
    setConfig(initialConfig);
    setSearchQuery("");
    setView(nextView);
  }

  function handleConnectGitHub() {
    if (!githubStatus.configured) {
      setFeedback({
        tone: "error",
        message:
          "GitHub OAuth is not configured yet. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to continue.",
      });
      return;
    }

    setIsConnecting(true);
    window.location.assign("/api/github/connect");
  }

  async function handleDisconnectGitHub() {
    setIsDisconnecting(true);

    try {
      await disconnectGitHub();
      setGithubStatus({
        configured: githubStatus.configured,
        connected: false,
        connection: null,
      });
      setRepos([]);
      resetImportFlow("inventory");
      setFeedback({
        tone: "info",
        message: "GitHub account disconnected from this workspace.",
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to disconnect GitHub.",
      });
    } finally {
      setIsDisconnecting(false);
    }
  }

  function startRepositoryImport(repo: GitHubRepositoryRecord) {
    setSelectedRepo(repo);
    setConfig({
      name: repo.name
        .split(/[-_]/g)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" "),
      repoPath: repo.repoPathSuggestion || repo.fullName,
      description:
        repo.description ||
        `Imported from GitHub repository ${repo.fullName}.`,
    });
    setView("configure");
  }

  async function handleCreateProject() {
    if (!selectedRepo || !config.name.trim()) {
      setFeedback({
        tone: "error",
        message: "Choose a repository and add a project name before importing.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const nextProject = await createProject({
        name: config.name.trim(),
        repoPath: config.repoPath.trim() || selectedRepo.repoPathSuggestion,
        description: config.description.trim() || undefined,
        sourceType: "github",
        repoUrl: selectedRepo.htmlUrl,
        githubOwner: selectedRepo.owner,
        githubRepo: selectedRepo.name,
        githubRepoId: selectedRepo.id,
        githubDefaultBranch: selectedRepo.defaultBranch,
        isPrivate: selectedRepo.isPrivate,
      });

      setProjects((current) => [nextProject, ...current]);
      setFeedback({
        tone: "success",
        message: `${selectedRepo.fullName} was imported into Projects.`,
      });
      resetImportFlow("inventory");
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to import the repository as a project.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Shell>
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-background px-6 py-4">
        <div className="flex items-center gap-4">
          {view !== "inventory" ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setView(view === "configure" ? "import" : "inventory")
              }
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : null}
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              {view === "inventory"
                ? "Projects"
                : view === "import"
                  ? "Import from GitHub"
                  : "Configure Project"}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {view === "inventory"
                ? "Connect GitHub and turn repositories into CodexFlow projects."
                : view === "import"
                  ? "Choose a repository from the connected GitHub account."
                  : `Review the project settings for ${selectedRepo?.fullName}.`}
            </p>
          </div>
        </div>

        {view === "inventory" ? (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => void Promise.all([loadProjects(), loadGitHubStatus()])}
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={() =>
                githubStatus.connected ? setView("import") : handleConnectGitHub()
              }
              disabled={statusLoading || isConnecting}
            >
              {statusLoading || isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : githubStatus.connected ? (
                <Plus className="h-4 w-4" />
              ) : (
                <Github className="h-4 w-4" />
              )}
              {githubStatus.connected ? "Import Repository" : "Connect GitHub"}
            </Button>
          </div>
        ) : null}
      </header>

      <div className="flex-1 overflow-y-auto bg-muted/20 scrollbar-thin">
        <div className="mx-auto max-w-6xl p-6 py-8">
          {feedback ? (
            <FeedbackBanner
              tone={feedback.tone}
              message={feedback.message}
              onDismiss={() => setFeedback(null)}
            />
          ) : null}

          {view === "inventory" ? (
            <InventoryView
              githubStatus={githubStatus}
              loading={projectsLoading || statusLoading}
              onConnectGithub={handleConnectGitHub}
              onImportGithub={() => setView("import")}
              projects={projects}
            />
          ) : null}

          {view === "import" ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <section className="overflow-hidden rounded-[24px] border border-border bg-background shadow-sm">
                <div className="border-b border-border bg-secondary/30 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                        <Github className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {githubStatus.connection?.login || "GitHub connection"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {githubStatus.connected
                            ? "Authenticated and ready to import repositories."
                            : "Connect GitHub to browse repositories."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {githubStatus.connected ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => void loadGitHubRepos()}
                            disabled={reposLoading}
                          >
                            <RefreshCcw className="h-4 w-4" />
                            Refresh repos
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onClick={() => void handleDisconnectGitHub()}
                            disabled={isDisconnecting}
                          >
                            {isDisconnecting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Unplug className="h-4 w-4" />
                            )}
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          className="gap-2"
                          onClick={handleConnectGitHub}
                          disabled={isConnecting}
                        >
                          {isConnecting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plug2 className="h-4 w-4" />
                          )}
                          Connect GitHub
                        </Button>
                      )}
                    </div>
                  </div>

                  {githubStatus.connected ? (
                    <div className="relative mt-5">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search repositories..."
                        className="pl-10"
                      />
                    </div>
                  ) : null}
                </div>

                {!githubStatus.configured ? (
                  <SetupEmptyState />
                ) : !githubStatus.connected ? (
                  <ConnectEmptyState onConnectGithub={handleConnectGitHub} />
                ) : reposLoading ? (
                  <div className="flex min-h-[420px] items-center justify-center">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading GitHub repositories…
                    </div>
                  </div>
                ) : filteredRepos.length === 0 ? (
                  <div className="flex min-h-[420px] items-center justify-center p-6">
                    <div className="max-w-md text-center">
                      <FolderGit2 className="mx-auto h-10 w-10 text-muted-foreground/40" />
                      <h2 className="mt-4 text-xl font-semibold text-foreground">
                        No matching repositories
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        Try a different search term or refresh the GitHub list to
                        pull the latest repositories from your account.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredRepos.map((repo) => (
                      <RepositoryRow
                        key={repo.id}
                        repo={repo}
                        onImport={() => startRepositoryImport(repo)}
                      />
                    ))}
                  </div>
                )}
              </section>

              <aside className="space-y-4">
                <ConnectedAccountCard githubStatus={githubStatus} />
                <div className="rounded-[24px] border border-border bg-background p-6 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Import Flow
                  </p>
                  <div className="mt-4 space-y-4">
                    <StepRow
                      active={githubStatus.connected}
                      title="Authenticate GitHub"
                      detail="Connect once, then browse repositories directly inside Projects."
                    />
                    <StepRow
                      active={githubStatus.connected}
                      title="Select repository"
                      detail="Choose a repo to import and confirm the local path CodexFlow should target."
                    />
                    <StepRow
                      active={Boolean(selectedRepo)}
                      title="Create project"
                      detail="Store GitHub metadata and use the project in the board/task workflow."
                    />
                  </div>
                </div>
              </aside>
            </div>
          ) : null}

          {view === "configure" && selectedRepo ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <section className="rounded-[24px] border border-border bg-background p-8 shadow-sm">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Project Configuration
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                    Import {selectedRepo.fullName}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                    Set the project name and the repo-aware path CodexFlow should
                    use when tasks are assigned to this imported repository.
                  </p>
                </div>

                <div className="mt-8 grid gap-6">
                  <ConfigField
                    label="Project name"
                    helper="This is how the imported repository will appear in your workspace."
                  >
                    <Input
                      value={config.name}
                      onChange={(event) =>
                        setConfig((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </ConfigField>

                  <ConfigField
                    label="Repository path"
                    helper="Keep this inside the configured repository root so tasks can execute safely."
                  >
                    <Input
                      value={config.repoPath}
                      onChange={(event) =>
                        setConfig((current) => ({
                          ...current,
                          repoPath: event.target.value,
                        }))
                      }
                    />
                  </ConfigField>

                  <ConfigField
                    label="Description"
                    helper="Optional context for operators and future teammates."
                  >
                    <Textarea
                      value={config.description}
                      onChange={(event) =>
                        setConfig((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                  </ConfigField>
                </div>

                <div className="mt-8 flex items-center justify-end gap-3 border-t border-border pt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setView("import")}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="gap-2"
                    onClick={() => void handleCreateProject()}
                    disabled={isSubmitting || !config.name.trim()}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Import Project
                  </Button>
                </div>
              </section>

              <aside className="space-y-6">
                <div className="rounded-[24px] border border-border bg-background p-6 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Repository Summary
                  </p>

                  <div className="mt-4 rounded-[20px] border border-border bg-muted/30 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                        <Github className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {selectedRepo.fullName}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Updated {formatTaskTimestamp(selectedRepo.updatedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3">
                      <MetaRow
                        label="Visibility"
                        value={selectedRepo.isPrivate ? "Private" : "Public"}
                        icon={
                          selectedRepo.isPrivate ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : (
                            <Globe className="h-3.5 w-3.5" />
                          )
                        }
                      />
                      <MetaRow
                        label="Default branch"
                        value={selectedRepo.defaultBranch}
                        icon={<GitBranch className="h-3.5 w-3.5" />}
                      />
                      <MetaRow
                        label="Repository URL"
                        value={selectedRepo.htmlUrl}
                        mono
                      />
                    </div>
                  </div>

                  <a
                    href={selectedRepo.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    Open in GitHub
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                <div className="rounded-[24px] border border-primary/10 bg-primary/5 p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Repo-aware import
                      </p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        CodexFlow stores the GitHub repository metadata here and
                        keeps the project pointed at the repo path you selected for
                        future task runs.
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}

function InventoryView({
  githubStatus,
  loading,
  onConnectGithub,
  onImportGithub,
  projects,
}: {
  githubStatus: GitHubConnectionStatus;
  loading: boolean;
  onConnectGithub: () => void;
  onImportGithub: () => void;
  projects: ProjectRecord[];
}) {
  if (loading) {
    return (
      <div className="flex min-h-[480px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading projects…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-[28px] border border-border bg-background p-8 shadow-sm">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
                <FolderGit2 className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="mt-8 text-3xl font-semibold tracking-tight text-foreground">
                Import your first repository
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                Connect GitHub like Vercel, choose a repository, and turn it into
                a CodexFlow project with repo-aware task routing and verification.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button
                  className="gap-2"
                  onClick={githubStatus.connected ? onImportGithub : onConnectGithub}
                >
                  <Github className="h-4 w-4" />
                  {githubStatus.connected ? "Open GitHub Import" : "Connect GitHub"}
                </Button>
                {githubStatus.connected ? (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={onImportGithub}
                  >
                    <Plus className="h-4 w-4" />
                    Browse Repositories
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Workspace Projects
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                    Imported repositories and workspace scopes
                  </h2>
                </div>
                <Button className="gap-2" onClick={onImportGithub}>
                  <Plus className="h-4 w-4" />
                  Import Repository
                </Button>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </>
          )}
        </section>

        <aside className="space-y-6">
          <ConnectedAccountCard githubStatus={githubStatus} />
          <div className="rounded-[24px] border border-border bg-background p-6 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Why import repos
            </p>
            <div className="mt-4 space-y-4">
              <StepRow
                active
                title="Project-aware tasks"
                detail="Assign future tasks against a named project instead of loose repo paths."
              />
              <StepRow
                active
                title="GitHub metadata"
                detail="Keep the repo URL, owner, branch, and visibility attached to the project."
              />
              <StepRow
                active
                title="Same-page workflow"
                detail="Connect, browse, and import inside the Projects screen without leaving the workspace."
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SetupEmptyState() {
  return (
    <div className="flex min-h-[420px] items-center justify-center p-6">
      <div className="max-w-xl rounded-[24px] border border-dashed border-border bg-muted/30 px-8 py-10 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
        <h2 className="mt-5 text-xl font-semibold text-foreground">
          GitHub OAuth needs configuration
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Add these environment variables before using GitHub import:
          <span className="mt-2 block font-mono text-xs text-foreground">
            GITHUB_CLIENT_ID
          </span>
          <span className="block font-mono text-xs text-foreground">
            GITHUB_CLIENT_SECRET
          </span>
          <span className="block font-mono text-xs text-foreground">
            GITHUB_OAUTH_REDIRECT_URI
          </span>
        </p>
      </div>
    </div>
  );
}

function ConnectEmptyState({
  onConnectGithub,
}: {
  onConnectGithub: () => void;
}) {
  return (
    <div className="flex min-h-[420px] items-center justify-center p-6">
      <div className="max-w-xl rounded-[24px] border border-dashed border-border bg-muted/30 px-8 py-10 text-center">
        <Github className="mx-auto h-10 w-10 text-foreground/60" />
        <h2 className="mt-5 text-xl font-semibold text-foreground">
          Connect GitHub to import repositories
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Authenticate your GitHub account, then browse repositories and import
          them directly into the Projects section like a Vercel-style flow.
        </p>
        <Button className="mt-6 gap-2" onClick={onConnectGithub}>
          <Plug2 className="h-4 w-4" />
          Connect GitHub
        </Button>
      </div>
    </div>
  );
}

function RepositoryRow({
  repo,
  onImport,
}: {
  repo: GitHubRepositoryRecord;
  onImport: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {repo.fullName}
          </p>
          <InlineBadge>{repo.isPrivate ? "Private" : "Public"}</InlineBadge>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>{repo.language || "Unknown stack"}</span>
          <span>Updated {formatTaskTimestamp(repo.updatedAt)}</span>
          <span>Branch {repo.defaultBranch}</span>
        </div>
        {repo.description ? (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            {repo.description}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <a
          href={repo.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-2 rounded-[var(--radius)] border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Open
          <ExternalLink className="h-4 w-4" />
        </a>
        <Button size="sm" className="gap-2" onClick={onImport}>
          <Plus className="h-4 w-4" />
          Import
        </Button>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectRecord }) {
  return (
    <article className="rounded-[22px] border border-border bg-background p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
          {project.sourceType === "github" ? (
            <Github className="h-5 w-5" />
          ) : (
            <FolderGit2 className="h-5 w-5" />
          )}
        </div>
        <InlineBadge>{project.sourceType === "github" ? "GitHub" : "Manual"}</InlineBadge>
      </div>

      <div className="mt-5">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {project.name}
        </h3>
        <p className="mt-1 text-xs font-mono text-muted-foreground">
          {project.repoPath}
        </p>
        <p className="mt-3 min-h-[3.5rem] text-sm leading-7 text-muted-foreground">
          {project.description || "Repository-aware project scope for CodexFlow."}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <StatTile label="Tasks" value={String(project.taskCount)} />
        <StatTile label="Open" value={String(project.openTaskCount)} />
        <StatTile
          label="Activity"
          value={project.lastActivityAt ? formatTaskTimestamp(project.lastActivityAt) : "No activity"}
        />
      </div>

      {project.repoUrl ? (
        <a
          href={project.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          Open repository
          <ExternalLink className="h-4 w-4" />
        </a>
      ) : null}
    </article>
  );
}

function ConnectedAccountCard({
  githubStatus,
}: {
  githubStatus: GitHubConnectionStatus;
}) {
  return (
    <div className="rounded-[24px] border border-border bg-background p-6 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        GitHub Connection
      </p>
      {githubStatus.connected && githubStatus.connection ? (
        <div className="mt-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-white"
              style={
                githubStatus.connection.avatarUrl
                  ? {
                      backgroundImage: `url(${githubStatus.connection.avatarUrl})`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                    }
                  : undefined
              }
            >
              {!githubStatus.connection.avatarUrl ? <Github className="h-5 w-5" /> : null}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {githubStatus.connection.login}
              </p>
              <p className="text-xs text-muted-foreground">
                Connected {formatTaskTimestamp(githubStatus.connection.connectedAt)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {githubStatus.connection.scopes.length > 0 ? (
              githubStatus.connection.scopes.map((scope) => (
                <InlineBadge key={scope}>{scope}</InlineBadge>
              ))
            ) : (
              <InlineBadge>repo</InlineBadge>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          No GitHub account connected to this workspace yet.
        </p>
      )}
    </div>
  );
}

function ConfigField({
  label,
  helper,
  children,
}: {
  label: string;
  helper: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <p className="text-xs leading-6 text-muted-foreground">{helper}</p>
      {children}
    </div>
  );
}

function StepRow({
  active,
  title,
  detail,
}: {
  active: boolean;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold",
          active
            ? "border-primary/20 bg-primary/10 text-primary"
            : "border-border bg-muted/50 text-muted-foreground"
        )}
      >
        {active ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function MetaRow({
  label,
  value,
  icon,
  mono = false,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-[18px] border border-border bg-background px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        <p className={cn("text-sm font-medium text-foreground", mono && "font-mono text-xs")}>
          {value}
        </p>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[16px] border border-border bg-muted/30 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function InlineBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </span>
  );
}

function FeedbackBanner({
  tone,
  message,
  onDismiss,
}: {
  tone: FeedbackTone;
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex items-start justify-between gap-4 rounded-[20px] border px-5 py-4 text-sm shadow-sm",
        tone === "success" &&
          "border-emerald-200 bg-emerald-50 text-emerald-800",
        tone === "error" && "border-red-200 bg-red-50 text-red-700",
        tone === "info" && "border-border bg-background text-foreground"
      )}
    >
      <div className="flex items-start gap-3">
        {tone === "success" ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4" />
        ) : tone === "error" ? (
          <AlertCircle className="mt-0.5 h-4 w-4" />
        ) : (
          <ShieldCheck className="mt-0.5 h-4 w-4" />
        )}
        <p>{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70 transition-opacity hover:opacity-100"
      >
        Dismiss
      </button>
    </div>
  );
}
