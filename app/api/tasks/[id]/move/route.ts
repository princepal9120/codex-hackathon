import { NextResponse } from "next/server";

import { moveTask } from "@/lib/server/task-store";
import type { TaskStatus } from "@/lib/task-types";

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const { status, position } = body as { status?: TaskStatus; position?: number };

        if (!status || typeof position !== "number") {
            return NextResponse.json({ error: "Missing required fields: status and position" }, { status: 400 });
        }

        const task = moveTask(params.id, status, position);

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        return NextResponse.json(task);
    } catch (error) {
        console.error("Failed to move task:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
