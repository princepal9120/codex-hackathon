import { NextResponse } from "next/server";

import { getGitHubOAuthConfig } from "@/lib/server/github-client";
import { getGitHubConnection } from "@/lib/server/github-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const configured = Boolean(getGitHubOAuthConfig());
  const connection = configured ? getGitHubConnection() : null;

  return NextResponse.json({
    configured,
    connected: Boolean(connection),
    connection,
  });
}
