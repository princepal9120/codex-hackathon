import { NextResponse } from "next/server";

import { clearGitHubConnection } from "@/lib/server/github-store";

export const runtime = "nodejs";

export async function POST() {
  clearGitHubConnection();

  return NextResponse.json({ ok: true });
}
