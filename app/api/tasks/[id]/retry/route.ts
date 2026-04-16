import { NextResponse } from "next/server";

import { queueTaskExecution } from "@/lib/server/run-task";
import { resetTaskForRetry } from "@/lib/server/task-store";

export const runtime = "nodejs";

interface TaskRetryRouteContext {
  params: {
    id: string;
  };
}

export async function POST(_request: Request, { params }: TaskRetryRouteContext) {
  const task = resetTaskForRetry(params.id);

  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  queueTaskExecution(task.id);

  return NextResponse.json({ task });
}
