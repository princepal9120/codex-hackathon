import type {
  CreateProjectInput,
  GitHubConnectionStatus,
  GitHubRepositoryRecord,
  ProjectRecord,
} from "@/lib/task-types";

export type { GitHubConnectionStatus, GitHubRepositoryRecord, ProjectRecord };

class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
}

async function fetchJson(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message =
      (typeof payload === "object" &&
        payload &&
        "error" in payload &&
        typeof payload.error === "string" &&
        payload.error) ||
      (typeof payload === "object" &&
        payload &&
        "message" in payload &&
        typeof payload.message === "string" &&
        payload.message) ||
      `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status);
  }

  return payload;
}

function normalizeProject(raw: unknown): ProjectRecord {
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    id: String(record.id ?? ""),
    name: typeof record.name === "string" ? record.name : "Untitled project",
    slug: typeof record.slug === "string" ? record.slug : "project",
    repoPath:
      typeof record.repoPath === "string"
        ? record.repoPath
        : typeof record.repo_path === "string"
          ? record.repo_path
          : ".",
    description: typeof record.description === "string" ? record.description : "",
    sourceType: record.sourceType === "github" || record.source_type === "github" ? "github" : "manual",
    repoUrl:
      typeof record.repoUrl === "string"
        ? record.repoUrl
        : typeof record.repo_url === "string"
          ? record.repo_url
          : null,
    githubOwner:
      typeof record.githubOwner === "string"
        ? record.githubOwner
        : typeof record.github_owner === "string"
          ? record.github_owner
          : null,
    githubRepo:
      typeof record.githubRepo === "string"
        ? record.githubRepo
        : typeof record.github_repo === "string"
          ? record.github_repo
          : null,
    githubRepoId:
      typeof record.githubRepoId === "string"
        ? record.githubRepoId
        : typeof record.github_repo_id === "string"
          ? record.github_repo_id
          : null,
    githubDefaultBranch:
      typeof record.githubDefaultBranch === "string"
        ? record.githubDefaultBranch
        : typeof record.github_default_branch === "string"
          ? record.github_default_branch
          : null,
    isPrivate:
      typeof record.isPrivate === "boolean"
        ? record.isPrivate
        : typeof record.github_is_private === "number"
          ? Boolean(record.github_is_private)
          : false,
    createdAt:
      typeof record.createdAt === "string"
        ? record.createdAt
        : typeof record.created_at === "string"
          ? record.created_at
          : new Date().toISOString(),
    updatedAt:
      typeof record.updatedAt === "string"
        ? record.updatedAt
        : typeof record.updated_at === "string"
          ? record.updated_at
          : new Date().toISOString(),
    taskCount:
      typeof record.taskCount === "number"
        ? record.taskCount
        : typeof record.task_count === "number"
          ? record.task_count
          : 0,
    openTaskCount:
      typeof record.openTaskCount === "number"
        ? record.openTaskCount
        : typeof record.open_task_count === "number"
          ? record.open_task_count
          : 0,
    lastActivityAt:
      typeof record.lastActivityAt === "string"
        ? record.lastActivityAt
        : typeof record.last_activity_at === "string"
          ? record.last_activity_at
          : null,
  };
}

function normalizeGitHubStatus(raw: unknown): GitHubConnectionStatus {
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const connection =
    record.connection && typeof record.connection === "object"
      ? (record.connection as Record<string, unknown>)
      : null;

  return {
    configured: Boolean(record.configured),
    connected: Boolean(record.connected),
    connection: connection
      ? {
          login: typeof connection.login === "string" ? connection.login : "github",
          avatarUrl:
            typeof connection.avatarUrl === "string"
              ? connection.avatarUrl
              : typeof connection.avatar_url === "string"
                ? connection.avatar_url
                : null,
          scopes: Array.isArray(connection.scopes)
            ? connection.scopes.filter(
                (scope): scope is string => typeof scope === "string"
              )
            : [],
          connectedAt:
            typeof connection.connectedAt === "string"
              ? connection.connectedAt
              : typeof connection.connected_at === "string"
                ? connection.connected_at
                : new Date().toISOString(),
        }
      : null,
  };
}

function normalizeGitHubRepository(raw: unknown): GitHubRepositoryRecord {
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    id: String(record.id ?? ""),
    name: typeof record.name === "string" ? record.name : "repository",
    fullName:
      typeof record.fullName === "string"
        ? record.fullName
        : typeof record.full_name === "string"
          ? record.full_name
          : "",
    owner: typeof record.owner === "string" ? record.owner : "",
    htmlUrl:
      typeof record.htmlUrl === "string"
        ? record.htmlUrl
        : typeof record.html_url === "string"
          ? record.html_url
          : "",
    description: typeof record.description === "string" ? record.description : null,
    defaultBranch:
      typeof record.defaultBranch === "string"
        ? record.defaultBranch
        : typeof record.default_branch === "string"
          ? record.default_branch
          : "main",
    isPrivate:
      typeof record.isPrivate === "boolean"
        ? record.isPrivate
        : typeof record.private === "boolean"
          ? record.private
          : false,
    language: typeof record.language === "string" ? record.language : null,
    updatedAt:
      typeof record.updatedAt === "string"
        ? record.updatedAt
        : typeof record.updated_at === "string"
          ? record.updated_at
          : new Date().toISOString(),
    repoPathSuggestion:
      typeof record.repoPathSuggestion === "string"
        ? record.repoPathSuggestion
        : typeof record.repo_path_suggestion === "string"
          ? record.repo_path_suggestion
          : ".",
  };
}

export async function fetchProjects() {
  const payload = await fetchJson("/api/projects");
  const projects =
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as Record<string, unknown>).projects)
      ? ((payload as Record<string, unknown>).projects as unknown[])
      : [];

  return projects.map(normalizeProject);
}

export async function createProject(input: CreateProjectInput) {
  const payload = await fetchJson("/api/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });

  const project =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>).project
      : null;

  return normalizeProject(project);
}

export async function fetchGitHubStatus() {
  const payload = await fetchJson("/api/github/status");
  return normalizeGitHubStatus(payload);
}

export async function fetchGitHubRepositories(query?: string) {
  const params = new URLSearchParams();

  if (query?.trim()) {
    params.set("q", query.trim());
  }

  const payload = await fetchJson(
    `/api/github/repos${params.size ? `?${params.toString()}` : ""}`
  );
  const repositories =
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as Record<string, unknown>).repositories)
      ? ((payload as Record<string, unknown>).repositories as unknown[])
      : [];

  return repositories.map(normalizeGitHubRepository);
}

export async function disconnectGitHub() {
  await fetchJson("/api/github/disconnect", { method: "POST" });
}
