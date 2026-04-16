import { NextResponse } from "next/server";

import {
  createGitHubOAuthState,
  getGitHubAuthorizeUrl,
  getGitHubOAuthConfig,
} from "@/lib/server/github-client";

export const runtime = "nodejs";

const GITHUB_STATE_COOKIE = "codexflow_github_oauth_state";

export async function GET(request: Request) {
  if (!getGitHubOAuthConfig()) {
    return NextResponse.redirect(new URL("/projects?github=missing-config", request.url));
  }

  const origin = new URL(request.url).origin;
  const state = createGitHubOAuthState();
  const response = NextResponse.redirect(getGitHubAuthorizeUrl(origin, state));

  response.cookies.set(GITHUB_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
