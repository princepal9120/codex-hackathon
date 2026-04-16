import { NextResponse } from "next/server";

import { queueTaskExecution } from "@/lib/server/run-task";
import { getTaskById, resetTaskForRetry } from "@/lib/server/task-store";

export const runtime = "nodejs";

interface TaskRouteContext {
  params: {
    id: string;
  };
}

export async function GET(_request: Request, { params }: TaskRouteContext) {
  const task = getTaskById(params.id);

  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  return NextResponse.json({ task });
}

export async function POST(_request: Request, { params }: TaskRouteContext) {
  const task = resetTaskForRetry(params.id);

  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  queueTaskExecution(task.id);

  return NextResponse.json({ task });
}
