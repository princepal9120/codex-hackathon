import { NextResponse } from "next/server";

import {
  GitHubApiError,
  fetchGitHubRepositories,
  getGitHubOAuthConfig,
} from "@/lib/server/github-client";
import {
  clearGitHubConnection,
  getGitHubConnectionRow,
} from "@/lib/server/github-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!getGitHubOAuthConfig()) {
    return NextResponse.json(
      { error: "GitHub OAuth is not configured." },
      { status: 400 }
    );
  }

  const connection = getGitHubConnectionRow();

  if (!connection) {
    return NextResponse.json(
      { error: "Connect a GitHub account before importing repositories." },
      { status: 401 }
    );
  }

  const query = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() || "";

  try {
    const repositories = await fetchGitHubRepositories(connection.access_token);
    const filtered = query
      ? repositories.filter((repo) =>
          `${repo.fullName} ${repo.language || ""} ${repo.description || ""}`
            .toLowerCase()
            .includes(query)
        )
      : repositories;

    return NextResponse.json({ repositories: filtered });
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 401) {
      clearGitHubConnection();
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load GitHub repositories.",
      },
      { status: error instanceof GitHubApiError ? error.status : 500 }
    );
  }
}
