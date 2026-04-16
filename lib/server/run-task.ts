import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

import { loadCodexFlowConfig, resolveTaskCommands, resolveTaskRepoPath } from "@/lib/config";
import { getTaskById, updateTask } from "@/lib/server/task-store";
import type { RunTaskResult, TaskEvent, TaskFailureSignal } from "@/lib/task-types";

const inFlightTasks = new Set<string>();

interface WorkerPayload {
  task: {
    id: string;
    title: string;
    prompt: string;
  };
  repoPath: string;
  lintCommand: string;
  testCommand: string;
  maxFiles: number;
}

function createEvent(input: Omit<TaskEvent, "id"> & { id?: string }): TaskEvent {
  return {
    id: input.id ?? randomUUID(),
    phase: input.phase,
    kind: input.kind,
    level: input.level,
    title: input.title,
    detail: input.detail,
    createdAt: input.createdAt,
    metadata: input.metadata,
  };
}

function mergeTimeline(base: TaskEvent[], additions: TaskEvent[]) {
  const seen = new Set(base.map((event) => `${event.kind}|${event.createdAt}|${event.title}|${event.detail}`));
  const merged = [...base];

  for (const event of additions) {
    const key = `${event.kind}|${event.createdAt}|${event.title}|${event.detail}`;
    if (!seen.has(key)) {
      merged.push(event);
      seen.add(key);
    }
  }

  return merged.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

function humanizeStep(step: string) {
  return step
    .split(/[_-]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapEngineStep(step: string | undefined) {
  switch (step) {
    case "task_received":
      return { phase: "task", kind: "task_created", title: "Task received" } as const;
    case "scan_repository":
      return { phase: "context", kind: "context_selected", title: "Repository scanned" } as const;
    case "rank_files":
      return { phase: "context", kind: "context_selected", title: "Files ranked" } as const;
    case "build_prompt":
      return { phase: "context", kind: "context_selected", title: "Prompt built" } as const;
    case "generate_patch_preview":
      return { phase: "execution", kind: "patch_generated", title: "Patch preview generated" } as const;
    case "verify_lint":
      return { phase: "verification", kind: "verification_completed", title: "Lint verification" } as const;
    case "verify_tests":
      return { phase: "verification", kind: "verification_completed", title: "Test verification" } as const;
    case "finalize":
      return { phase: "task", kind: "run_completed", title: "Run finalized" } as const;
    case "engine_failure":
      return { phase: "task", kind: "run_failed", title: "Engine failure" } as const;
    default:
      return null;
  }
}

function normalizeTimelineEvent(entry: unknown): TaskEvent | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const record = entry as Record<string, unknown>;
  const engineStep = typeof record.step === "string" ? record.step : undefined;
  const engineMapping = mapEngineStep(engineStep);
  const title =
    (typeof record.title === "string" && record.title) ||
    engineMapping?.title ||
    (engineStep ? humanizeStep(engineStep) : "Task update");
  const detail =
    (typeof record.detail === "string" && record.detail) ||
    (typeof record.message === "string" && record.message) ||
    (typeof record.summary === "string" && record.summary) ||
    "No additional detail captured.";
  const createdAt =
    (typeof record.createdAt === "string" && record.createdAt) ||
    (typeof record.created_at === "string" && record.created_at) ||
    (typeof record.at === "string" && record.at) ||
    new Date().toISOString();
  const level =
    record.level === "info" ||
    record.level === "success" ||
    record.level === "warning" ||
    record.level === "error"
      ? record.level
      : record.status === "failed"
        ? "error"
        : record.status === "warning"
          ? "warning"
          : record.status === "completed"
            ? "success"
            : "info";

  return createEvent({
    id: typeof record.id === "string" ? record.id : undefined,
    phase:
      record.phase === "task" ||
      record.phase === "context" ||
      record.phase === "execution" ||
      record.phase === "verification"
        ? record.phase
        : engineMapping?.phase ?? "execution",
    kind:
      record.kind === "task_created" ||
      record.kind === "task_requeued" ||
      record.kind === "run_started" ||
      record.kind === "context_selected" ||
      record.kind === "patch_generated" ||
      record.kind === "verification_completed" ||
      record.kind === "run_completed" ||
      record.kind === "run_failed"
        ? record.kind
        : engineMapping?.kind ?? "run_completed",
    level,
    title,
    detail,
    createdAt,
    metadata:
      record.metadata && typeof record.metadata === "object"
        ? (record.metadata as TaskEvent["metadata"])
        : record.details && typeof record.details === "object"
          ? (record.details as TaskEvent["metadata"])
          : undefined,
  });
}

function normalizeResultTimeline(result: RunTaskResult, finishedAt: string): TaskEvent[] {
  const candidateLists = [
    (result as RunTaskResult & { timeline?: unknown }).timeline,
    (result as RunTaskResult & { executionTimeline?: unknown }).executionTimeline,
    (result as RunTaskResult & { executionHistory?: unknown }).executionHistory,
    (result as RunTaskResult & { history?: unknown }).history,
    (result as RunTaskResult & { events?: unknown }).events,
  ];

  for (const candidate of candidateLists) {
    if (!Array.isArray(candidate)) {
      continue;
    }

    const normalized = candidate
      .map((entry) => normalizeTimelineEvent(entry))
      .filter((entry): entry is TaskEvent => Boolean(entry));

    if (normalized.length > 0) {
      return normalized;
    }
  }

  const derived: TaskEvent[] = [];

  if (result.selectedFiles.length > 0) {
    derived.push(
      createEvent({
        phase: "context",
        kind: "context_selected",
        level: "success",
        title: "Context selected",
        detail: `Ranked ${result.selectedFiles.length} files for prompt context before patch generation.`,
        createdAt: finishedAt,
        metadata: {
          selectedFiles: result.selectedFiles.length,
        },
      })
    );
  }

  derived.push(
    createEvent({
      phase: "execution",
      kind: "patch_generated",
      level: result.diffOutput.trim() ? "success" : "warning",
      title: result.diffOutput.trim() ? "Patch preview ready" : "No patch preview generated",
      detail: result.diffOutput.trim()
        ? "A diff preview was generated and stored for review."
        : "The worker completed without producing a usable diff preview.",
      createdAt: finishedAt,
    })
  );

  const verificationLevel =
    result.lintStatus === "failed" || result.testStatus === "failed"
      ? "error"
      : result.lintStatus === "passed" && result.testStatus === "passed"
        ? "success"
        : "warning";

  derived.push(
    createEvent({
      phase: "verification",
      kind: "verification_completed",
      level: verificationLevel,
      title:
        verificationLevel === "error"
          ? "Verification failed"
          : verificationLevel === "success"
            ? "Verification passed"
            : "Verification pending",
      detail: `Lint: ${result.lintStatus}. Tests: ${result.testStatus}.`,
      createdAt: finishedAt,
    })
  );

  derived.push(
    createEvent({
      phase: "task",
      kind: result.status === "failed" ? "run_failed" : "run_completed",
      level: result.status === "failed" ? "error" : result.status === "needs_review" ? "warning" : "success",
      title: result.status === "failed" ? "Run failed" : "Run completed",
      detail:
        result.status === "failed"
          ? "Execution finished in a failed state. Inspect the failure signal and verification output."
          : result.status === "needs_review"
            ? "Execution completed with a preview that still needs human review."
            : "Execution completed successfully with verification evidence.",
      createdAt: finishedAt,
    })
  );

  return derived;
}

function normalizeFailureSignal(result: RunTaskResult, finishedAt: string): TaskFailureSignal | null {
  const raw = (result as RunTaskResult & { failureSignal?: unknown; failure_signal?: unknown }).failureSignal ??
    (result as RunTaskResult & { failureSignal?: unknown; failure_signal?: unknown }).failure_signal;

  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    const category =
      record.category === "verification" ||
      record.category === "execution" ||
      record.category === "empty_patch" ||
      record.category === "unknown"
        ? record.category
        : null;

    if (category) {
      return {
        category,
        summary: typeof record.summary === "string" ? record.summary : "Task failed",
        detail: typeof record.detail === "string" ? record.detail : "No failure detail captured.",
        detectedAt:
          (typeof record.detectedAt === "string" && record.detectedAt) ||
          (typeof record.detected_at === "string" && record.detected_at) ||
          finishedAt,
      };
    }
  }

  if (result.status !== "failed") {
    return null;
  }

  if (!result.diffOutput.trim()) {
    return {
      category: "empty_patch",
      summary: "No usable patch preview was generated",
      detail: "The run finished without a diff preview, so there is nothing safe to review or apply.",
      detectedAt: finishedAt,
    };
  }

  if (result.lintStatus === "failed" || result.testStatus === "failed") {
    return {
      category: "verification",
      summary: "Verification failed after patch generation",
      detail: `Lint status: ${result.lintStatus}. Test status: ${result.testStatus}. Review the raw outputs before retrying.`,
      detectedAt: finishedAt,
    };
  }

  if (result.errorMessage) {
    return {
      category: "execution",
      summary: "Execution failed before verification completed",
      detail: result.errorMessage,
      detectedAt: finishedAt,
    };
  }

  return {
    category: "unknown",
    summary: "Task failed for an unknown reason",
    detail: "The run failed without a recognizable verification or execution signature.",
    detectedAt: finishedAt,
  };
}

function runWorker(payload: WorkerPayload) {
  return new Promise<RunTaskResult>((resolve, reject) => {
    const child = spawn("python3", ["-m", "engine.run_task"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PATH: `/Users/prince/.nvm/versions/node/v24.13.0/bin:${process.env.PATH || ""}`,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => reject(error));

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Python worker exited with code ${code}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout) as RunTaskResult);
      } catch (error) {
        reject(new Error(`Failed to parse worker output: ${String(error)}\n${stdout}`));
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

export async function executeTask(taskId: string) {
  const task = getTaskById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  const config = loadCodexFlowConfig();
  const repoPath = resolveTaskRepoPath(task, config);
  const commands = resolveTaskCommands(task, config);
  const runStartedAt = new Date().toISOString();
  const runningTask = updateTask(taskId, {
    status: "running",
    runStartedAt,
    runFinishedAt: null,
    logs: `Loading repository context from ${repoPath}...\nPreparing patch preview before any human review.`,
    verificationNotes: "Patch preview is in progress. Verification results will populate after lint and tests finish.",
    errorMessage: null,
    timeline: mergeTimeline(task.timeline, [
      createEvent({
        phase: "execution",
        kind: "run_started",
        level: "info",
        title: "Run started",
        detail: `Execution started for repository path ${repoPath}.`,
        createdAt: runStartedAt,
        metadata: {
          repoPath,
        },
      }),
    ]),
    failureSignal: null,
  });

  try {
    const result = await runWorker({
      task: {
        id: task.id,
        title: task.title,
        prompt: task.prompt,
      },
      repoPath,
      lintCommand: commands.lintCommand,
      testCommand: commands.testCommand,
      maxFiles: config.maxFiles,
    });

    const finishedAt = new Date().toISOString();
    const baseTimeline = runningTask?.timeline ?? task.timeline;

    return updateTask(taskId, {
      status: result.status,
      score: result.score,
      selectedFiles: result.selectedFiles,
      promptPreview: result.promptPreview,
      contextSummary: result.contextSummary,
      executionMode: result.executionMode,
      codexOutput: result.codexOutput,
      diffOutput: result.diffOutput,
      patchSummary: result.patchSummary,
      lintStatus: result.lintStatus,
      testStatus: result.testStatus,
      lintOutput: result.lintOutput,
      testOutput: result.testOutput,
      verificationNotes: result.verificationNotes,
      logs: result.logs,
      errorMessage: result.errorMessage ?? null,
      runFinishedAt: finishedAt,
      timeline: mergeTimeline(baseTimeline, normalizeResultTimeline(result, finishedAt)),
      failureSignal: normalizeFailureSignal(result, finishedAt),
    });
  } catch (error) {
    const finishedAt = new Date().toISOString();
    const baseTimeline = runningTask?.timeline ?? task.timeline;
    const errorMessage = String(error);

    return updateTask(taskId, {
      status: "failed",
      lintStatus: "failed",
      testStatus: "failed",
      lintOutput: "",
      testOutput: "",
      verificationNotes: "Execution failed before a verified patch preview could be trusted.",
      logs: `Execution failed.\n\n${errorMessage}`,
      errorMessage,
      runFinishedAt: finishedAt,
      timeline: mergeTimeline(baseTimeline, [
        createEvent({
          phase: "task",
          kind: "run_failed",
          level: "error",
          title: "Run failed",
          detail: errorMessage,
          createdAt: finishedAt,
        }),
      ]),
      failureSignal: {
        category: "execution",
        summary: "Execution failed before worker results were persisted",
        detail: errorMessage,
        detectedAt: finishedAt,
      },
    });
  }
}

export function queueTaskExecution(taskId: string) {
  if (inFlightTasks.has(taskId)) {
    return false;
  }

  inFlightTasks.add(taskId);

  queueMicrotask(() => {
    void executeTask(taskId).finally(() => {
      inFlightTasks.delete(taskId);
    });
  });

  return true;
}
