import { getDb } from "@/lib/db";
import type { GitHubConnectionRecord } from "@/lib/task-types";

interface GitHubConnectionRow {
  id: string;
  github_user_id: string;
  login: string;
  avatar_url: string | null;
  access_token: string;
  token_type: string;
  scope: string;
  created_at: string;
  updated_at: string;
}

interface UpsertGitHubConnectionInput {
  githubUserId: string;
  login: string;
  avatarUrl: string | null;
  accessToken: string;
  tokenType: string;
  scope: string;
}

const PRIMARY_CONNECTION_ID = "primary";

function rowToPublicConnection(row: GitHubConnectionRow): GitHubConnectionRecord {
  return {
    login: row.login,
    avatarUrl: row.avatar_url,
    scopes: row.scope
      .split(",")
      .map((scope) => scope.trim())
      .filter(Boolean),
    connectedAt: row.updated_at,
  };
}

export function getGitHubConnectionRow() {
  return getDb()
    .prepare("SELECT * FROM github_connections WHERE id = ?")
    .get(PRIMARY_CONNECTION_ID) as GitHubConnectionRow | undefined;
}

export function getGitHubConnection() {
  const row = getGitHubConnectionRow();
  return row ? rowToPublicConnection(row) : null;
}

export function upsertGitHubConnection(input: UpsertGitHubConnectionInput) {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare("DELETE FROM github_connections WHERE id <> ?").run(PRIMARY_CONNECTION_ID);
  db.prepare(`
    INSERT INTO github_connections (
      id,
      github_user_id,
      login,
      avatar_url,
      access_token,
      token_type,
      scope,
      created_at,
      updated_at
    ) VALUES (
      :id,
      :github_user_id,
      :login,
      :avatar_url,
      :access_token,
      :token_type,
      :scope,
      :created_at,
      :updated_at
    )
    ON CONFLICT(id) DO UPDATE SET
      github_user_id = excluded.github_user_id,
      login = excluded.login,
      avatar_url = excluded.avatar_url,
      access_token = excluded.access_token,
      token_type = excluded.token_type,
      scope = excluded.scope,
      updated_at = excluded.updated_at
  `).run({
    id: PRIMARY_CONNECTION_ID,
    github_user_id: input.githubUserId,
    login: input.login,
    avatar_url: input.avatarUrl,
    access_token: input.accessToken,
    token_type: input.tokenType,
    scope: input.scope,
    created_at: now,
    updated_at: now,
  });

  return getGitHubConnection();
}

export function clearGitHubConnection() {
  getDb().prepare("DELETE FROM github_connections WHERE id = ?").run(PRIMARY_CONNECTION_ID);
}
