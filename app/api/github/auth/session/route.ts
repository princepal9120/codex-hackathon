import { NextResponse } from 'next/server';

import {
  clearGitHubAuthCookies,
  getGitHubAccessToken,
  isGitHubOAuthConfigured,
} from '@/lib/server/github-oauth';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    configured: isGitHubOAuthConfigured(),
    connected: Boolean(getGitHubAccessToken()),
  });
}

export async function DELETE() {
  const response = NextResponse.json({ configured: isGitHubOAuthConfigured(), connected: false });
  clearGitHubAuthCookies(response);
  return response;
}
