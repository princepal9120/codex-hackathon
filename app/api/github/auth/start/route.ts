import { randomBytes } from 'node:crypto';

import { NextResponse } from 'next/server';

import {
  buildGitHubAuthorizeUrl,
  buildGitHubProjectsRedirectUrl,
  getGitHubStateCookieOptions,
  GITHUB_STATE_COOKIE_NAME,
  GitHubOAuthError,
} from '@/lib/server/github-oauth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const state = randomBytes(24).toString('hex');
    const response = NextResponse.redirect(buildGitHubAuthorizeUrl(request, state));
    response.cookies.set(GITHUB_STATE_COOKIE_NAME, state, getGitHubStateCookieOptions());
    return response;
  } catch (error) {
    const message = error instanceof GitHubOAuthError ? error.message : 'Unable to start GitHub sign-in.';
    return NextResponse.redirect(buildGitHubProjectsRedirectUrl(request, { github_error: message }));
  }
}
