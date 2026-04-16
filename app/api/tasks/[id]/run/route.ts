import { NextResponse } from "next/server";

import { queueTaskExecution } from "@/lib/server/run-task";
import { getTaskById } from "@/lib/server/task-store";

export const runtime = "nodejs";

interface TaskRunRouteContext {
  params: {
    id: string;
  };
}

export async function POST(_request: Request, { params }: TaskRunRouteContext) {
  const task = getTaskById(params.id);

  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  if (task.status !== "queued" && task.status !== "running") {
    return NextResponse.json(
      { error: "Only queued or running tasks can be started. Use the retry endpoint for completed tasks." },
      { status: 409 }
    );
  }

  queueTaskExecution(task.id);

  return NextResponse.json({ task: getTaskById(task.id) ?? task });
}
