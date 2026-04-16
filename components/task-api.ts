import { mockTasks } from "@/data/mockTasks";

export type TaskStatus = "queued" | "running" | "passed" | "failed" | "needs_review";
export type VerificationStatus = "passed" | "failed" | "pending";
export type TaskSource = "api" | "mock";

export interface TaskFile {
  path: string;
  score: number | null;
}

export interface TaskRecord {
  id: string;
  title: string;
  prompt: string;
  status: TaskStatus;
  score: number | null;
  selectedFiles: TaskFile[];
  codexOutput: string;
  diff: string;
  lintStatus: VerificationStatus;
  testStatus: VerificationStatus;
  logs: string;
  updatedAt: string;
  createdAt?: string;
  runStartedAt?: string | null;
  runFinishedAt?: string | null;
  errorMessage?: string | null;
  repoPath?: string;
}

export interface TaskCollectionResult {
  tasks: TaskRecord[];
  source: TaskSource;
  message?: string;
}

export interface TaskDetailResult {
  task: TaskRecord | null;
  source: TaskSource;
  message?: string;
}

export interface CreateTaskInput {
  title: string;
  prompt: string;
  repoPath?: string;
  lintCommand?: string;
  testCommand?: string;
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

const terminalStatuses = new Set<TaskStatus>(["passed", "failed", "needs_review"]);

export function isTerminalStatus(status: TaskStatus) {
  return terminalStatuses.has(status);
}

export function formatTaskTimestamp(value?: string | null) {
  if (!value) {
    return "Just now";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const diffMs = parsed.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, "day");
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
}

async function fetchJson(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message =
      (typeof payload === "object" && payload && "error" in payload && typeof payload.error === "string" && payload.error) ||
      (typeof payload === "object" && payload && "message" in payload && typeof payload.message === "string" && payload.message) ||
      `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status);
  }

  return payload;
}

function toTaskStatus(value: unknown): TaskStatus {
  switch (typeof value === "string" ? value.toLowerCase() : "") {
    case "queued":
    case "running":
    case "passed":
    case "failed":
    case "needs_review":
      return value as TaskStatus;
    case "needs review":
      return "needs_review";
    default:
      return "queued";
  }
}

function toVerificationStatus(value: unknown, fallback: VerificationStatus = "pending"): VerificationStatus {
  switch (typeof value === "string" ? value.toLowerCase() : "") {
    case "passed":
    case "success":
      return "passed";
    case "failed":
    case "error":
      return "failed";
    case "pending":
    case "queued":
    case "running":
      return "pending";
    default:
      return fallback;
  }
}

function toStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.flatMap((entry) => {
    if (typeof entry === "string") {
      return [entry];
    }

    return [];
  });
}

function toSelectedFiles(value: unknown): TaskFile[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (typeof entry === "string") {
      return [{ path: entry, score: null }];
    }

    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as Record<string, unknown>;
    const path =
      (typeof record.path === "string" && record.path) ||
      (typeof record.file === "string" && record.file) ||
      (typeof record.name === "string" && record.name) ||
      "";

    if (!path) {
      return [];
    }

    const rawScore = record.score ?? record.relevance ?? record.weight;
    return [
      {
        path,
        score: typeof rawScore === "number" ? rawScore : null,
      },
    ];
  });
}

function joinLogParts(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join("\n\n");
}

function normalizeTask(raw: unknown): TaskRecord {
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const verification =
    record.verification && typeof record.verification === "object"
      ? (record.verification as Record<string, unknown>)
      : {};
  const lint = verification.lint && typeof verification.lint === "object" ? (verification.lint as Record<string, unknown>) : {};
  const tests =
    verification.tests && typeof verification.tests === "object"
      ? (verification.tests as Record<string, unknown>)
      : verification.test && typeof verification.test === "object"
        ? (verification.test as Record<string, unknown>)
        : {};
  const execution = record.execution && typeof record.execution === "object" ? (record.execution as Record<string, unknown>) : {};

  const status = toTaskStatus(record.status ?? record.task_status);
  const lintStatus = toVerificationStatus(record.lintStatus ?? record.lint_status ?? lint.status, status === "failed" ? "failed" : "pending");
  const testStatus = toVerificationStatus(record.testStatus ?? record.test_status ?? tests.status, status === "failed" ? "failed" : "pending");

  const diff =
    (typeof record.diff === "string" && record.diff) ||
    (typeof execution.diff === "string" && execution.diff) ||
    (typeof record.patch === "string" && record.patch) ||
    "";

  const logs =
    (typeof record.logs === "string" && record.logs) ||
    joinLogParts([
      typeof execution.summary === "string" ? execution.summary : null,
      typeof lint.output === "string" ? `Lint\n${lint.output}` : null,
      typeof tests.output === "string" ? `Tests\n${tests.output}` : null,
      toStringList(execution.logs).join("\n"),
      toStringList(record.logLines).join("\n"),
    ]);

  const selectedFiles =
    toSelectedFiles(record.selectedFiles) ||
    toSelectedFiles(record.selected_files) ||
    toSelectedFiles(record.files) ||
    toSelectedFiles(execution.selectedFiles) ||
    [];

  const rawScore = record.score ?? verification.score ?? execution.score ?? null;

  return {
    id: String(record.id ?? record.taskId ?? record.task_id ?? ""),
    title: typeof record.title === "string" && record.title ? record.title : "Untitled task",
    prompt:
      (typeof record.prompt === "string" && record.prompt) ||
      (typeof record.description === "string" && record.description) ||
      "No prompt provided.",
    status,
    score: typeof rawScore === "number" ? rawScore : null,
    selectedFiles,
    codexOutput:
      (typeof record.codexOutput === "string" && record.codexOutput) ||
      (typeof record.codex_output === "string" && record.codex_output) ||
      "",
    diff,
    lintStatus,
    testStatus,
    logs,
    createdAt:
      (typeof record.createdAt === "string" && record.createdAt) ||
      (typeof record.created_at === "string" && record.created_at) ||
      undefined,
    updatedAt:
      (typeof record.updatedAt === "string" && record.updatedAt) ||
      (typeof record.updated_at === "string" && record.updated_at) ||
      (typeof record.createdAt === "string" && record.createdAt) ||
      (typeof record.created_at === "string" && record.created_at) ||
      new Date().toISOString(),
    runStartedAt:
      (typeof record.runStartedAt === "string" && record.runStartedAt) ||
      (typeof record.run_started_at === "string" && record.run_started_at) ||
      null,
    runFinishedAt:
      (typeof record.runFinishedAt === "string" && record.runFinishedAt) ||
      (typeof record.run_finished_at === "string" && record.run_finished_at) ||
      null,
    errorMessage:
      (typeof record.errorMessage === "string" && record.errorMessage) ||
      (typeof record.error_message === "string" && record.error_message) ||
      null,
    repoPath:
      (typeof record.repoPath === "string" && record.repoPath) ||
      (typeof record.repo_path === "string" && record.repo_path) ||
      undefined,
  };
}

function getTaskList(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (Array.isArray(record.tasks)) {
      return record.tasks;
    }
  }

  return [];
}

function getTaskPayload(payload: unknown) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (record.task) {
      return record.task;
    }
  }

  return payload;
}

function getMockCollection(message: string): TaskCollectionResult {
  return {
    tasks: mockTasks.map(normalizeTask),
    source: "mock",
    message,
  };
}

function getMockDetail(id: string, message: string): TaskDetailResult {
  const task = mockTasks.find((entry) => entry.id === id);

  return {
    task: task ? normalizeTask(task) : null,
    source: "mock",
    message,
  };
}

export async function fetchTasks(): Promise<TaskCollectionResult> {
  try {
    const payload = await fetchJson("/api/tasks");
    return {
      tasks: getTaskList(payload).map(normalizeTask),
      source: "api",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load tasks.";
    return getMockCollection(`${message} Showing bundled demo data instead.`);
  }
}

export async function fetchTask(taskId: string): Promise<TaskDetailResult> {
  try {
    const payload = await fetchJson(`/api/tasks/${taskId}`);
    return {
      task: normalizeTask(getTaskPayload(payload)),
      source: "api",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load task.";
    return getMockDetail(taskId, `${message} Showing bundled demo data instead.`);
  }
}

export async function createTask(input: CreateTaskInput): Promise<TaskRecord> {
  const payload = await fetchJson("/api/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return normalizeTask(getTaskPayload(payload));
}

export async function retryTask(taskId: string): Promise<TaskRecord> {
  const payload = await fetchJson(`/api/tasks/${taskId}`, {
    method: "POST",
  });

  return normalizeTask(getTaskPayload(payload));
}
