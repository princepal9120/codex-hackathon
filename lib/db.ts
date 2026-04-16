import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

let database: Database.Database | null = null;
const TASK_COLUMN_DEFINITIONS: Record<string, string> = {
  project_id: "TEXT",
  task_kind: "TEXT NOT NULL DEFAULT 'issue'",
  prompt_preview: "TEXT NOT NULL DEFAULT ''",
  context_summary: "TEXT NOT NULL DEFAULT ''",
  execution_mode: "TEXT NOT NULL DEFAULT ''",
  patch_summary: "TEXT NOT NULL DEFAULT ''",
  lint_output: "TEXT NOT NULL DEFAULT ''",
  test_output: "TEXT NOT NULL DEFAULT ''",
  verification_notes: "TEXT NOT NULL DEFAULT ''",
  timeline_json: "TEXT NOT NULL DEFAULT '[]'",
  failure_signal_json: "TEXT",
  board_position: "REAL NOT NULL DEFAULT 0",
};

const PROJECT_COLUMN_DEFINITIONS: Record<string, string> = {
  repo_path: "TEXT NOT NULL DEFAULT '.'",
  source_type: "TEXT NOT NULL DEFAULT 'manual'",
  repo_url: "TEXT",
  github_owner: "TEXT",
  github_repo: "TEXT",
  github_repo_id: "TEXT",
  github_default_branch: "TEXT",
  github_is_private: "INTEGER NOT NULL DEFAULT 0",
};

function extractLegacyProjectRepoPath(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return null;
    }

    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") {
        continue;
      }

      const repoPath = (entry as Record<string, unknown>).repoPath;

      if (typeof repoPath === "string" && repoPath.trim().length > 0) {
        return repoPath.trim();
      }
    }
  } catch {
    return null;
  }

  return null;
}

function getDatabasePath() {
  // Vercel serverless functions have a read-only filesystem except /tmp.
  // Use /tmp on Vercel, otherwise use the project-local data/ directory.
  const base = process.env.VERCEL ? "/tmp" : process.cwd();
  const dataDir = path.join(base, "data");
  fs.mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, "codexflow.sqlite");
}

function initialize(db: Database.Database) {
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      repo_path TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      source_type TEXT NOT NULL DEFAULT 'manual',
      repo_url TEXT,
      github_owner TEXT,
      github_repo TEXT,
      github_repo_id TEXT,
      github_default_branch TEXT,
      github_is_private INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS github_connections (
      id TEXT PRIMARY KEY,
      github_user_id TEXT NOT NULL,
      login TEXT NOT NULL,
      avatar_url TEXT,
      access_token TEXT NOT NULL,
      token_type TEXT NOT NULL DEFAULT 'bearer',
      scope TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      prompt TEXT NOT NULL,
      status TEXT NOT NULL,
      project_id TEXT,
      task_kind TEXT NOT NULL DEFAULT 'issue',
      repo_path TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      run_started_at TEXT,
      run_finished_at TEXT,
      score INTEGER NOT NULL DEFAULT 0,
      selected_files_json TEXT NOT NULL DEFAULT '[]',
      prompt_preview TEXT NOT NULL DEFAULT '',
      context_summary TEXT NOT NULL DEFAULT '',
      execution_mode TEXT NOT NULL DEFAULT '',
      codex_output TEXT NOT NULL DEFAULT '',
      diff_output TEXT NOT NULL DEFAULT '',
      patch_summary TEXT NOT NULL DEFAULT '',
      lint_status TEXT NOT NULL DEFAULT 'pending',
      test_status TEXT NOT NULL DEFAULT 'pending',
      lint_output TEXT NOT NULL DEFAULT '',
      test_output TEXT NOT NULL DEFAULT '',
      verification_notes TEXT NOT NULL DEFAULT '',
      logs TEXT NOT NULL DEFAULT '',
      error_message TEXT,
      lint_command TEXT,
      test_command TEXT,
      timeline_json TEXT NOT NULL DEFAULT '[]',
      failure_signal_json TEXT,
      board_position REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );
  `);

  const existingColumns = new Set(
    (
      db.prepare("PRAGMA table_info(tasks)").all() as Array<{
        name: string;
      }>
    ).map((column) => column.name)
  );

  for (const [columnName, definition] of Object.entries(TASK_COLUMN_DEFINITIONS)) {
    if (!existingColumns.has(columnName)) {
      db.exec(`ALTER TABLE tasks ADD COLUMN ${columnName} ${definition};`);
    }
  }

  const existingProjectColumns = new Set(
    (
      db.prepare("PRAGMA table_info(projects)").all() as Array<{
        name: string;
      }>
    ).map((column) => column.name)
  );
  const hasLegacyRepositoriesJson = existingProjectColumns.has("repositories_json");

  for (const [columnName, definition] of Object.entries(PROJECT_COLUMN_DEFINITIONS)) {
    if (!existingProjectColumns.has(columnName)) {
      db.exec(`ALTER TABLE projects ADD COLUMN ${columnName} ${definition};`);
    }
  }

  if (hasLegacyRepositoriesJson) {
    const updateProjectRepoPath = db.prepare(
      "UPDATE projects SET repo_path = :repo_path WHERE id = :id"
    );
    const legacyRows = db.prepare("SELECT id, repo_path, repositories_json FROM projects").all() as Array<{
      id: string;
      repo_path: string | null;
      repositories_json: string | null;
    }>;

    for (const row of legacyRows) {
      const currentRepoPath = row.repo_path?.trim();

      if (currentRepoPath && currentRepoPath !== ".") {
        continue;
      }

      const legacyRepoPath = extractLegacyProjectRepoPath(row.repositories_json);

      if (legacyRepoPath && legacyRepoPath !== currentRepoPath) {
        updateProjectRepoPath.run({
          repo_path: legacyRepoPath,
          id: row.id,
        });
      }
    }
  }
}

export function getDb() {
  if (!database) {
    database = new Database(getDatabasePath());
    initialize(database);
  }

  return database;
}
