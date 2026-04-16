import { randomBytes } from "node:crypto";

import type { GitHubRepositoryRecord } from "@/lib/task-types";

interface GitHubTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  avatar_url: string | null;
}

interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  default_branch: string;
  private: boolean;
  language: string | null;
  updated_at: string;
  owner?: {
    login?: string;
  };
}

export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
  scope: string;
}

export class GitHubApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "GitHubApiError";
  }
}

function getGitHubHeaders(accessToken?: string) {
  return {
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

function getPaginationNext(linkHeader: string | null) {
  if (!linkHeader) {
    return null;
  }

  for (const part of linkHeader.split(",")) {
    const trimmed = part.trim();
    const match = trimmed.match(/<([^>]+)>;\s*rel="([^"]+)"/);

    if (match?.[2] === "next") {
      return match[1];
    }
  }

  return null;
}

function normalizeRepository(repo: GitHubRepoResponse): GitHubRepositoryRecord {
  return {
    id: String(repo.id),
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner?.login || repo.full_name.split("/")[0] || "",
    htmlUrl: repo.html_url,
    description: repo.description,
    defaultBranch: repo.default_branch,
    isPrivate: repo.private,
    language: repo.language,
    updatedAt: repo.updated_at,
    repoPathSuggestion: repo.full_name,
  };
}

export function getGitHubOAuthConfig(): GitHubOAuthConfig | null {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    scope: process.env.GITHUB_OAUTH_SCOPE?.trim() || "repo read:user",
  };
}

export function createGitHubOAuthState() {
  return randomBytes(24).toString("hex");
}

export function getGitHubRedirectUri(origin: string) {
  const configured = process.env.GITHUB_OAUTH_REDIRECT_URI?.trim();
  if (configured && configured.length > 0) return configured;
  return `${origin}/api/github/callback`;
}

export function getGitHubAuthorizeUrl(origin: string, state: string) {
  const config = getGitHubOAuthConfig();

  if (!config) {
    throw new Error("GitHub OAuth is not configured.");
  }

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", getGitHubRedirectUri(origin));
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("state", state);
  url.searchParams.set("allow_signup", "false");

  return url.toString();
}

export async function exchangeGitHubCodeForToken(params: {
  code: string;
  origin: string;
}) {
  const config = getGitHubOAuthConfig();

  if (!config) {
    throw new Error("GitHub OAuth is not configured.");
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: getGitHubHeaders(),
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: params.code,
      redirect_uri: getGitHubRedirectUri(params.origin),
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as GitHubTokenResponse;

  if (!response.ok || !payload.access_token) {
    const message =
      payload.error_description ||
      payload.error ||
      "GitHub did not return an access token.";

    throw new GitHubApiError(message, response.status);
  }

  return {
    accessToken: payload.access_token,
    tokenType: payload.token_type || "bearer",
    scope: payload.scope || "",
  };
}

export async function fetchGitHubViewer(accessToken: string) {
  const response = await fetch("https://api.github.com/user", {
    headers: getGitHubHeaders(accessToken),
    cache: "no-store",
  });

  const payload = (await response.json()) as Partial<GitHubUserResponse> & {
    message?: string;
  };

  if (!response.ok || !payload.id || !payload.login) {
    throw new GitHubApiError(payload.message || "Failed to load the authenticated GitHub user.", response.status);
  }

  return {
    id: String(payload.id),
    login: payload.login,
    avatarUrl: payload.avatar_url || null,
  };
}

export async function fetchGitHubRepositories(accessToken: string) {
  const repositories: GitHubRepositoryRecord[] = [];
  let nextUrl: string | null =
    "https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&sort=updated&per_page=100";

  while (nextUrl && repositories.length < 300) {
    const response = await fetch(nextUrl, {
      headers: getGitHubHeaders(accessToken),
      cache: "no-store",
    });

    const payload = (await response.json()) as GitHubRepoResponse[] | { message?: string };

    if (!response.ok || !Array.isArray(payload)) {
      const message =
        !Array.isArray(payload) && payload?.message
          ? payload.message
          : "Failed to load GitHub repositories.";

      throw new GitHubApiError(message, response.status);
    }

    repositories.push(...payload.map(normalizeRepository));
    nextUrl = getPaginationNext(response.headers.get("link"));
  }

  return repositories;
}
