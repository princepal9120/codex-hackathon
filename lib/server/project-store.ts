import { randomUUID } from "node:crypto";

import { getDb } from "@/lib/db";
import type { CreateProjectInput, ProjectRecord, ProjectSourceType } from "@/lib/task-types";

interface ProjectRow {
  id: string;
  name: string;
  slug: string;
  repo_path: string;
  description: string;
  source_type: ProjectSourceType | null;
  repo_url: string | null;
  github_owner: string | null;
  github_repo: string | null;
  github_repo_id: string | null;
  github_default_branch: string | null;
  github_is_private: number | null;
  created_at: string;
  updated_at: string;
  task_count?: number;
  open_task_count?: number;
  last_activity_at?: string | null;
}

const seedProjects: Array<
  Omit<ProjectRecord, "taskCount" | "openTaskCount" | "lastActivityAt">
> = [
  {
    id: randomUUID(),
    name: "Engineering",
    slug: "engineering",
    repoPath: ".",
    description:
      "Default workspace for repo-aware issues, implementation tasks, and operator reports.",
    sourceType: "manual",
    repoUrl: null,
    githubOwner: null,
    githubRepo: null,
    githubRepoId: null,
    githubDefaultBranch: null,
    isPrivate: false,
    createdAt: new Date("2026-04-15T09:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-04-15T09:00:00.000Z").toISOString(),
  },
];

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "project"
  );
}

function normalizeSourceType(value: string | null | undefined): ProjectSourceType {
  return value === "github" ? "github" : "manual";
}

function rowToProject(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    repoPath: row.repo_path,
    description: row.description,
    sourceType: normalizeSourceType(row.source_type),
    repoUrl: row.repo_url,
    githubOwner: row.github_owner,
    githubRepo: row.github_repo,
    githubRepoId: row.github_repo_id,
    githubDefaultBranch: row.github_default_branch,
    isPrivate: Boolean(row.github_is_private ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    taskCount: Number(row.task_count ?? 0),
    openTaskCount: Number(row.open_task_count ?? 0),
    lastActivityAt: row.last_activity_at ?? null,
  };
}

function insertProject(
  project: Omit<ProjectRecord, "taskCount" | "openTaskCount" | "lastActivityAt">
) {
  getDb()
    .prepare(`
      INSERT INTO projects (
        id,
        name,
        slug,
        repo_path,
        description,
        source_type,
        repo_url,
        github_owner,
        github_repo,
        github_repo_id,
        github_default_branch,
        github_is_private,
        created_at,
        updated_at
      ) VALUES (
        :id,
        :name,
        :slug,
        :repo_path,
        :description,
        :source_type,
        :repo_url,
        :github_owner,
        :github_repo,
        :github_repo_id,
        :github_default_branch,
        :github_is_private,
        :created_at,
        :updated_at
      )
    `)
    .run({
      id: project.id,
      name: project.name,
      slug: project.slug,
      repo_path: project.repoPath,
      description: project.description,
      source_type: project.sourceType,
      repo_url: project.repoUrl,
      github_owner: project.githubOwner,
      github_repo: project.githubRepo,
      github_repo_id: project.githubRepoId,
      github_default_branch: project.githubDefaultBranch,
      github_is_private: project.isPrivate ? 1 : 0,
      created_at: project.createdAt,
      updated_at: project.updatedAt,
    });
}

export function ensureSeedProjects() {
  const db = getDb();
  const count = (
    db.prepare("SELECT COUNT(*) as count FROM projects").get() as { count: number }
  ).count;

  if (count > 0) {
    return;
  }

  for (const project of seedProjects) {
    insertProject(project);
  }
}

export function listProjects() {
  ensureSeedProjects();
  const rows = getDb()
    .prepare(`
      SELECT
        p.*,
        COUNT(t.id) AS task_count,
        SUM(CASE WHEN t.status IN ('queued', 'running') THEN 1 ELSE 0 END) AS open_task_count,
        MAX(t.updated_at) AS last_activity_at
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      GROUP BY p.id
      ORDER BY COALESCE(MAX(t.updated_at), p.updated_at) DESC, p.name ASC
    `)
    .all() as ProjectRow[];

  return rows.map(rowToProject);
}

export function getProjectById(id: string) {
  ensureSeedProjects();
  const row = getDb()
    .prepare(`
      SELECT
        p.*,
        COUNT(t.id) AS task_count,
        SUM(CASE WHEN t.status IN ('queued', 'running') THEN 1 ELSE 0 END) AS open_task_count,
        MAX(t.updated_at) AS last_activity_at
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.id = ?
      GROUP BY p.id
    `)
    .get(id) as ProjectRow | undefined;

  return row ? rowToProject(row) : null;
}

export function getDefaultProject() {
  return listProjects()[0] ?? null;
}

function ensureUniqueSlug(name: string) {
  const db = getDb();
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let index = 2;

  while (db.prepare("SELECT id FROM projects WHERE slug = ?").get(slug)) {
    slug = `${baseSlug}-${index}`;
    index += 1;
  }

  return slug;
}

function findProjectByGitHubRepoId(githubRepoId: string | undefined) {
  const normalized = githubRepoId?.trim();

  if (!normalized) {
    return null;
  }

  return getDb()
    .prepare("SELECT id FROM projects WHERE github_repo_id = ?")
    .get(normalized) as { id: string } | undefined;
}

export function createProject(input: CreateProjectInput) {
  ensureSeedProjects();

  const name = input.name.trim();

  if (!name) {
    throw new Error("Project name is required.");
  }

  const existingGithubProject = findProjectByGitHubRepoId(input.githubRepoId);

  if (existingGithubProject) {
    throw new Error("That GitHub repository has already been imported into a project.");
  }

  const now = new Date().toISOString();
  const project = {
    id: randomUUID(),
    name,
    slug: ensureUniqueSlug(name),
    repoPath: input.repoPath?.trim() || ".",
    description: input.description?.trim() || "",
    sourceType: input.sourceType === "github" ? "github" : "manual",
    repoUrl: input.repoUrl?.trim() || null,
    githubOwner: input.githubOwner?.trim() || null,
    githubRepo: input.githubRepo?.trim() || null,
    githubRepoId: input.githubRepoId?.trim() || null,
    githubDefaultBranch: input.githubDefaultBranch?.trim() || null,
    isPrivate: Boolean(input.isPrivate),
    createdAt: now,
    updatedAt: now,
  } satisfies Omit<ProjectRecord, "taskCount" | "openTaskCount" | "lastActivityAt">;

  insertProject(project);

  return {
    ...project,
    taskCount: 0,
    openTaskCount: 0,
    lastActivityAt: null,
  } as ProjectRecord;
}
