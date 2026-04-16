import { NextResponse } from 'next/server';

import {
  clearGitHubAuthCookies,
  fetchGitHubRepositories,
  getGitHubAccessToken,
  isGitHubOAuthConfigured,
  GitHubOAuthError,
} from '@/lib/server/github-oauth';

export const runtime = 'nodejs';

export async function GET() {
  if (!isGitHubOAuthConfigured()) {
    return NextResponse.json(
      { error: 'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.' },
      { status: 503 }
    );
  }

  const accessToken = getGitHubAccessToken();

  if (!accessToken) {
    return NextResponse.json({ error: 'Connect GitHub before importing repositories.' }, { status: 401 });
  }

  try {
    const repositories = await fetchGitHubRepositories(accessToken);
    return NextResponse.json({ repositories });
  } catch (error) {
    if (error instanceof GitHubOAuthError && (error.status === 401 || error.status === 403)) {
      const response = NextResponse.json({ error: error.message }, { status: error.status });
      clearGitHubAuthCookies(response);
      return response;
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch GitHub repositories.' },
      { status: 502 }
    );
  }
}
