import { cookies } from 'next/headers';

export interface GitHubRepositoryRecord {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  updatedAt: string;
  language: string | null;
  private: boolean;
}

interface GitHubTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
  scope?: string;
  token_type?: string;
}

interface GitHubRepositoryApiRecord {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  updated_at: string;
  language: string | null;
  private: boolean;
}

export class GitHubOAuthError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'GitHubOAuthError';
  }
}

export const GITHUB_TOKEN_COOKIE_NAME = 'codexflow_github_token';
export const GITHUB_STATE_COOKIE_NAME = 'codexflow_github_state';

const DEFAULT_GITHUB_SCOPE = 'read:user user:email repo';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function readRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

function getBaseUrl(request: Request) {
  const configuredBaseUrl =
    readRequiredEnv('GITHUB_OAUTH_BASE_URL') ??
    readRequiredEnv('APP_URL') ??
    readRequiredEnv('NEXT_PUBLIC_APP_URL');

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}

function getOAuthConfig(request: Request) {
  const clientId = readRequiredEnv('GITHUB_CLIENT_ID');
  const clientSecret = readRequiredEnv('GITHUB_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new GitHubOAuthError('GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.', 503);
  }

  return {
    clientId,
    clientSecret,
    scope: readRequiredEnv('GITHUB_OAUTH_SCOPE') ?? DEFAULT_GITHUB_SCOPE,
    callbackUrl: new URL('/api/github/auth/callback', getBaseUrl(request)).toString(),
  };
}

export function isGitHubOAuthConfigured() {
  return Boolean(readRequiredEnv('GITHUB_CLIENT_ID') && readRequiredEnv('GITHUB_CLIENT_SECRET'));
}

export function buildGitHubProjectsRedirectUrl(request: Request, searchParams: Record<string, string>) {
  const url = new URL('/projects', getBaseUrl(request));

  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }

  return url;
}

export function getGitHubStateCookieOptions() {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
  };
}

export function getGitHubTokenCookieOptions() {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  };
}

export function getGitHubAccessToken() {
  return cookies().get(GITHUB_TOKEN_COOKIE_NAME)?.value ?? null;
}

export function clearGitHubAuthCookies(response: {
  cookies: {
    set: (name: string, value: string, options: Record<string, unknown>) => void;
  };
}) {
  response.cookies.set(GITHUB_TOKEN_COOKIE_NAME, '', { ...getGitHubTokenCookieOptions(), maxAge: 0 });
  response.cookies.set(GITHUB_STATE_COOKIE_NAME, '', { ...getGitHubStateCookieOptions(), maxAge: 0 });
}

export function buildGitHubAuthorizeUrl(request: Request, state: string) {
  const { clientId, callbackUrl, scope } = getOAuthConfig(request);
  const url = new URL('https://github.com/login/oauth/authorize');

  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', callbackUrl);
  url.searchParams.set('scope', scope);
  url.searchParams.set('state', state);
  url.searchParams.set('allow_signup', 'true');

  return url;
}

export async function exchangeGitHubCodeForToken(request: Request, code: string) {
  const { clientId, clientSecret, callbackUrl } = getOAuthConfig(request);
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'CodexFlow',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl,
    }),
    cache: 'no-store',
  });

  const payload = (await response.json()) as GitHubTokenResponse;

  if (!response.ok || !payload.access_token) {
    throw new GitHubOAuthError(payload.error_description || payload.error || 'GitHub token exchange failed.', response.status || 502);
  }

  return payload.access_token;
}

async function parseGitHubApiResponse<T>(response: Response) {
  const payload = (await response.json()) as T | { message?: string };

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : 'GitHub API request failed.';
    throw new GitHubOAuthError(message, response.status);
  }

  return payload as T;
}

export async function fetchGitHubRepositories(accessToken: string) {
  const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100&visibility=all', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'CodexFlow',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
  });

  const repositories = await parseGitHubApiResponse<GitHubRepositoryApiRecord[]>(response);

  return repositories.map((repository) => ({
    id: repository.id,
    name: repository.name,
    fullName: repository.full_name,
    description: repository.description,
    updatedAt: repository.updated_at,
    language: repository.language,
    private: repository.private,
  })) satisfies GitHubRepositoryRecord[];
}
