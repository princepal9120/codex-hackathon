import { NextResponse } from "next/server";

import { loadCodexFlowConfig, resolveRepoPathWithinConfig } from "@/lib/config";
import { createProject, listProjects } from "@/lib/server/project-store";
import { ensureSeedTasks } from "@/lib/server/task-store";
import type { CreateProjectInput } from "@/lib/task-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeInput(body: unknown): CreateProjectInput {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  return {
    name: typeof record.name === "string" ? record.name : "",
    repoPath: typeof record.repoPath === "string" ? record.repoPath : undefined,
    description: typeof record.description === "string" ? record.description : undefined,
    sourceType: record.sourceType === "github" ? "github" : undefined,
    repoUrl: typeof record.repoUrl === "string" ? record.repoUrl : undefined,
    githubOwner: typeof record.githubOwner === "string" ? record.githubOwner : undefined,
    githubRepo: typeof record.githubRepo === "string" ? record.githubRepo : undefined,
    githubRepoId: typeof record.githubRepoId === "string" ? record.githubRepoId : undefined,
    githubDefaultBranch:
      typeof record.githubDefaultBranch === "string" ? record.githubDefaultBranch : undefined,
    isPrivate: typeof record.isPrivate === "boolean" ? record.isPrivate : undefined,
  };
}

export async function GET() {
  ensureSeedTasks();
  return NextResponse.json({ projects: listProjects() });
}

export async function POST(request: Request) {
  const input = normalizeInput(await request.json());

  if (!input.name.trim()) {
    return NextResponse.json({ error: "Project name is required." }, { status: 400 });
  }

  const config = loadCodexFlowConfig();
  if (!resolveRepoPathWithinConfig(input.repoPath, config)) {
    return NextResponse.json({ error: "Project repository path must stay inside the configured repository root." }, { status: 400 });
  }

  try {
    const project = createProject({
      name: input.name,
      repoPath: input.repoPath,
      description: input.description,
      sourceType: input.sourceType,
      repoUrl: input.repoUrl,
      githubOwner: input.githubOwner,
      githubRepo: input.githubRepo,
      githubRepoId: input.githubRepoId,
      githubDefaultBranch: input.githubDefaultBranch,
      isPrivate: input.isPrivate,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create the project.",
      },
      { status: 400 }
    );
  }
}
