import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  buildGitHubProjectsRedirectUrl,
  clearGitHubAuthCookies,
  exchangeGitHubCodeForToken,
  getGitHubStateCookieOptions,
  getGitHubTokenCookieOptions,
  GITHUB_STATE_COOKIE_NAME,
  GITHUB_TOKEN_COOKIE_NAME,
  GitHubOAuthError,
} from '@/lib/server/github-oauth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expectedState = cookies().get(GITHUB_STATE_COOKIE_NAME)?.value ?? null;

  if (error) {
    const response = NextResponse.redirect(
      buildGitHubProjectsRedirectUrl(request, { github_error: errorDescription || error })
    );
    clearGitHubAuthCookies(response);
    return response;
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    const response = NextResponse.redirect(
      buildGitHubProjectsRedirectUrl(request, { github_error: 'GitHub sign-in expired or returned an invalid state.' })
    );
    clearGitHubAuthCookies(response);
    return response;
  }

  try {
    const accessToken = await exchangeGitHubCodeForToken(request, code);
    const response = NextResponse.redirect(buildGitHubProjectsRedirectUrl(request, { github_connected: '1' }));
    response.cookies.set(GITHUB_TOKEN_COOKIE_NAME, accessToken, getGitHubTokenCookieOptions());
    response.cookies.set(GITHUB_STATE_COOKIE_NAME, '', { ...getGitHubStateCookieOptions(), maxAge: 0 });
    return response;
  } catch (tokenError) {
    const response = NextResponse.redirect(
      buildGitHubProjectsRedirectUrl(request, {
        github_error:
          tokenError instanceof GitHubOAuthError ? tokenError.message : 'GitHub sign-in failed during token exchange.',
      })
    );
    clearGitHubAuthCookies(response);
    return response;
  }
}
