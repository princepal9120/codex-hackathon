import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  exchangeGitHubCodeForToken,
  fetchGitHubViewer,
  getGitHubOAuthConfig,
} from "@/lib/server/github-client";
import { upsertGitHubConnection } from "@/lib/server/github-store";

export const runtime = "nodejs";

const GITHUB_STATE_COOKIE = "codexflow_github_oauth_state";

function redirectWithStatus(request: Request, status: string, message?: string) {
  const url = new URL("/projects", request.url);
  url.searchParams.set("github", status);

  if (message) {
    url.searchParams.set("message", message);
  }

  const response = NextResponse.redirect(url);
  response.cookies.delete(GITHUB_STATE_COOKIE);
  return response;
}

export async function GET(request: Request) {
  if (!getGitHubOAuthConfig()) {
    return redirectWithStatus(request, "missing-config");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const cookieStore = cookies();
  const storedState = cookieStore.get(GITHUB_STATE_COOKIE)?.value;

  if (error) {
    return redirectWithStatus(request, "failed", "GitHub authorization was cancelled.");
  }

  if (!code || !state || !storedState || state !== storedState) {
    return redirectWithStatus(request, "failed", "GitHub OAuth state validation failed.");
  }

  try {
    const origin = url.origin;
    const token = await exchangeGitHubCodeForToken({ code, origin });
    const viewer = await fetchGitHubViewer(token.accessToken);

    upsertGitHubConnection({
      githubUserId: viewer.id,
      login: viewer.login,
      avatarUrl: viewer.avatarUrl,
      accessToken: token.accessToken,
      tokenType: token.tokenType,
      scope: token.scope,
    });

    return redirectWithStatus(request, "connected");
  } catch (exchangeError) {
    return redirectWithStatus(
      request,
      "failed",
      exchangeError instanceof Error
        ? exchangeError.message
        : "GitHub connection failed during callback."
    );
  }
}
