import { NextResponse } from "next/server";

import { queueTaskExecution } from "@/lib/server/run-task";
import { createTask, listTasks } from "@/lib/server/task-store";
import type { CreateTaskInput } from "@/lib/task-types";

export const runtime = "nodejs";

function normalizeInput(body: unknown): CreateTaskInput {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  return {
    title: typeof record.title === "string" ? record.title : "",
    prompt: typeof record.prompt === "string" ? record.prompt : "",
    repoPath: typeof record.repoPath === "string" ? record.repoPath : undefined,
    lintCommand: typeof record.lintCommand === "string" ? record.lintCommand : undefined,
    testCommand: typeof record.testCommand === "string" ? record.testCommand : undefined,
  };
}

export async function GET() {
  return NextResponse.json({ tasks: listTasks() });
}

export async function POST(request: Request) {
  const input = normalizeInput(await request.json());

  if (!input.title.trim() || !input.prompt.trim()) {
    return NextResponse.json(
      { error: "Title and prompt are required." },
      { status: 400 }
    );
  }

  const task = createTask(input);
  queueTaskExecution(task.id);
  return NextResponse.json({ task }, { status: 201 });
}
