export type TaskStatus = "queued" | "running" | "passed" | "failed" | "needs_review";
export type VerificationStatus = "passed" | "failed" | "pending";
export type TaskSource = "api" | "mock";
export type TaskBadgeVariant = "primary" | "secondary" | "queued" | "running" | "passed" | "failed" | "warning";
export type TaskTimelineEventPhase = "task" | "context" | "execution" | "verification";
export type TaskTimelineEventKind =
  | "task_created"
  | "task_requeued"
  | "run_started"
  | "context_selected"
  | "patch_generated"
  | "verification_completed"
  | "run_completed"
  | "run_failed";
export type TaskTimelineEventLevel = "info" | "success" | "warning" | "error";
export type FailureClassification = "verification" | "execution" | "empty_patch" | "unknown";

export const TASK_REFRESH_INTERVAL_MS = 5000;

export interface TaskTimelineEvent {
  id: string;
  phase: TaskTimelineEventPhase;
  kind: TaskTimelineEventKind;
  level: TaskTimelineEventLevel;
  title: string;
  detail: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface TaskFailureSignal {
  category: FailureClassification;
  summary: string;
  detail: string;
  detectedAt: string;
}

export interface TaskFile {
  path: string;
  score: number | null;
  rationale?: string;
  matchedTerms?: string[];
  excerpt?: string;
}

export interface TaskRecord {
  id: string;
  title: string;
  prompt: string;
  status: TaskStatus;
  score: number | null;
  selectedFiles: TaskFile[];
  promptPreview: string;
  contextSummary: string;
  executionMode: string;
  codexOutput: string;
  diff: string;
  patchSummary: string;
  lintStatus: VerificationStatus;
  testStatus: VerificationStatus;
  lintOutput: string;
  testOutput: string;
  verificationNotes: string;
  logs: string;
  updatedAt: string;
  createdAt?: string;
  runStartedAt?: string | null;
  runFinishedAt?: string | null;
  errorMessage?: string | null;
  repoPath?: string;
  lintCommand?: string | null;
  testCommand?: string | null;
  timeline: TaskTimelineEvent[];
  failureSignal: TaskFailureSignal | null;
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

export function getTaskIdentifier(taskId: string) {
  return `TASK-${taskId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || "0000"}`;
}

export function getTaskStatusMeta(status: TaskStatus): { label: string; variant: TaskBadgeVariant } {
  switch (status) {
    case "queued":
      return { label: "Queued", variant: "queued" };
    case "running":
      return { label: "Running", variant: "running" };
    case "passed":
      return { label: "Passed", variant: "passed" };
    case "failed":
      return { label: "Failed", variant: "failed" };
    case "needs_review":
      return { label: "Needs Review", variant: "warning" };
  }
}

export function getVerificationMeta(status: VerificationStatus): { label: string; variant: TaskBadgeVariant } {
  switch (status) {
    case "passed":
      return { label: "Passed", variant: "passed" };
    case "failed":
      return { label: "Failed", variant: "failed" };
    case "pending":
      return { label: "Pending", variant: "queued" };
  }
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

  const selected: TaskFile[] = [];

  for (const entry of value) {
    if (typeof entry === "string") {
      selected.push({ path: entry, score: null });
      continue;
    }

    if (!entry || typeof entry !== "object") {
      continue;
    }

    const record = entry as Record<string, unknown>;
    const path =
      (typeof record.path === "string" && record.path) ||
      (typeof record.file === "string" && record.file) ||
      (typeof record.name === "string" && record.name) ||
      "";

    if (!path) {
      continue;
    }

    const rawScore = record.score ?? record.relevance ?? record.weight;
    selected.push({
      path,
      score: typeof rawScore === "number" ? rawScore : null,
      rationale: typeof record.rationale === "string" ? record.rationale : undefined,
      matchedTerms: Array.isArray(record.matchedTerms)
        ? record.matchedTerms.filter((value): value is string => typeof value === "string")
        : Array.isArray(record.matched_terms)
          ? record.matched_terms.filter((value): value is string => typeof value === "string")
          : undefined,
      excerpt: typeof record.excerpt === "string" ? record.excerpt : undefined,
    });
  }

  return selected;
}

function toTimelineEvents(value: unknown): TaskTimelineEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as Record<string, unknown>;
    const phase: TaskTimelineEventPhase =
      record.phase === "task" ||
      record.phase === "context" ||
      record.phase === "execution" ||
      record.phase === "verification"
        ? record.phase
        : "execution";
    const kind: TaskTimelineEventKind =
      record.kind === "task_created" ||
      record.kind === "task_requeued" ||
      record.kind === "run_started" ||
      record.kind === "context_selected" ||
      record.kind === "patch_generated" ||
      record.kind === "verification_completed" ||
      record.kind === "run_completed" ||
      record.kind === "run_failed"
        ? record.kind
        : "run_completed";
    const level: TaskTimelineEventLevel =
      record.level === "info" ||
      record.level === "success" ||
      record.level === "warning" ||
      record.level === "error"
        ? record.level
        : "info";

    return [
      {
        id: typeof record.id === "string" ? record.id : `${kind}-${String(record.createdAt ?? record.created_at ?? Math.random())}`,
        phase,
        kind,
        level,
        title: typeof record.title === "string" ? record.title : "Task update",
        detail:
          (typeof record.detail === "string" && record.detail) ||
          (typeof record.message === "string" && record.message) ||
          "No additional detail captured.",
        createdAt:
          (typeof record.createdAt === "string" && record.createdAt) ||
          (typeof record.created_at === "string" && record.created_at) ||
          new Date(0).toISOString(),
        metadata:
          record.metadata && typeof record.metadata === "object"
            ? (record.metadata as TaskTimelineEvent["metadata"])
            : undefined,
      },
    ];
  });
}

function toFailureSignal(value: unknown): TaskFailureSignal | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const category: FailureClassification | null =
    record.category === "verification" ||
    record.category === "execution" ||
    record.category === "empty_patch" ||
    record.category === "unknown"
      ? record.category
      : null;

  if (!category) {
    return null;
  }

  return {
    category,
    summary: typeof record.summary === "string" ? record.summary : "Task failed",
    detail: typeof record.detail === "string" ? record.detail : "No failure detail captured.",
    detectedAt:
      (typeof record.detectedAt === "string" && record.detectedAt) ||
      (typeof record.detected_at === "string" && record.detected_at) ||
      new Date(0).toISOString(),
  };
}

function firstNonEmptyList<T>(...lists: T[][]) {
  return lists.find((list) => list.length > 0) ?? [];
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
    (typeof record.diffOutput === "string" && record.diffOutput) ||
    (typeof record.diff_output === "string" && record.diff_output) ||
    (typeof execution.diffOutput === "string" && execution.diffOutput) ||
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

  const selectedFiles = firstNonEmptyList(
    toSelectedFiles(record.selectedFiles),
    toSelectedFiles(record.selected_files),
    toSelectedFiles(record.files),
    toSelectedFiles(execution.selectedFiles)
  );

  const rawScore = record.score ?? verification.score ?? execution.score ?? null;
  const timeline = firstNonEmptyList(
    toTimelineEvents(record.timeline),
    toTimelineEvents(record.events),
    toTimelineEvents(execution.timeline)
  );
  const failureSignal =
    toFailureSignal(record.failureSignal) ||
    toFailureSignal(record.failure_signal) ||
    null;

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
    promptPreview:
      (typeof record.promptPreview === "string" && record.promptPreview) ||
      (typeof record.prompt_preview === "string" && record.prompt_preview) ||
      "",
    contextSummary:
      (typeof record.contextSummary === "string" && record.contextSummary) ||
      (typeof record.context_summary === "string" && record.context_summary) ||
      "",
    executionMode:
      (typeof record.executionMode === "string" && record.executionMode) ||
      (typeof record.execution_mode === "string" && record.execution_mode) ||
      "",
    codexOutput:
      (typeof record.codexOutput === "string" && record.codexOutput) ||
      (typeof record.codex_output === "string" && record.codex_output) ||
      "",
    diff,
    patchSummary:
      (typeof record.patchSummary === "string" && record.patchSummary) ||
      (typeof record.patch_summary === "string" && record.patch_summary) ||
      "",
    lintStatus,
    testStatus,
    lintOutput:
      (typeof record.lintOutput === "string" && record.lintOutput) ||
      (typeof record.lint_output === "string" && record.lint_output) ||
      "",
    testOutput:
      (typeof record.testOutput === "string" && record.testOutput) ||
      (typeof record.test_output === "string" && record.test_output) ||
      "",
    verificationNotes:
      (typeof record.verificationNotes === "string" && record.verificationNotes) ||
      (typeof record.verification_notes === "string" && record.verification_notes) ||
      "",
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
    lintCommand:
      (typeof record.lintCommand === "string" && record.lintCommand) ||
      (typeof record.lint_command === "string" && record.lint_command) ||
      null,
    testCommand:
      (typeof record.testCommand === "string" && record.testCommand) ||
      (typeof record.test_command === "string" && record.test_command) ||
      null,
    timeline,
    failureSignal,
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
    tasks: [],
    source: "mock",
    message,
  };
}

function getMockDetail(_id: string, message: string): TaskDetailResult {
  return {
    task: null,
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
  const payload = await fetchJson(`/api/tasks/${taskId}/retry`, {
    method: "POST",
  });

  return normalizeTask(getTaskPayload(payload));
}

export async function runTask(taskId: string): Promise<TaskRecord> {
  const payload = await fetchJson(`/api/tasks/${taskId}/run`, {
    method: "POST",
  });

  return normalizeTask(getTaskPayload(payload));
}

export function getConfidenceLabel(score: number | null) {
  if (score === null) {
    return "Unscored";
  }
  if (score >= 90) {
    return "High confidence";
  }
  if (score >= 70) {
    return "Good confidence";
  }
  if (score >= 50) {
    return "Needs review";
  }
  return "Low confidence";
}

export function getFailureClassificationLabel(classification: FailureClassification) {
  switch (classification) {
    case "verification":
      return "Verification";
    case "execution":
      return "Execution";
    case "empty_patch":
      return "Empty patch";
    case "unknown":
      return "Unknown";
  }
}
