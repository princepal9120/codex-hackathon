import { mockTasks } from "@/data/mockTasks";

export type TaskStatus = "queued" | "running" | "passed" | "failed" | "needs_review";
export type VerificationStatus = "passed" | "failed" | "pending";
export type TaskSource = "api" | "mock";
export type TaskTimelineEventKind = "task" | "context" | "execution" | "verification" | "failure" | "system";
export type FailureSignalClassification = "execution" | "lint" | "test" | "verification" | "context" | "infrastructure" | "unknown";

export interface TaskFile {
  path: string;
  score: number | null;
  rationale?: string;
  matchedTerms?: string[];
  excerpt?: string;
}

export interface TaskTimelineEvent {
  id: string;
  kind: TaskTimelineEventKind;
  label: string;
  detail?: string;
  status?: TaskStatus;
  createdAt?: string | null;
  source?: string;
}

export interface TaskFailureSignal {
  classification: FailureSignalClassification;
  summary: string;
  detail?: string;
  action?: string;
  source?: string;
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
  timeline: TaskTimelineEvent[];
  latestEvent: TaskTimelineEvent | null;
  failureSignal: TaskFailureSignal | null;
  statusSummary: string;
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

export function getFailureClassificationLabel(classification: FailureSignalClassification) {
  switch (classification) {
    case "execution":
      return "Execution failure";
    case "lint":
      return "Lint failure";
    case "test":
      return "Test failure";
    case "verification":
      return "Review gate";
    case "context":
      return "Context issue";
    case "infrastructure":
      return "Infra issue";
    case "unknown":
      return "Unknown issue";
  }
}

export function getTaskStatusSummary(task: Pick<TaskRecord, "status" | "failureSignal" | "lintStatus" | "testStatus" | "errorMessage" | "runStartedAt" | "latestEvent">) {
  if (task.status === "failed") {
    if (task.failureSignal?.summary) {
      return task.failureSignal.summary;
    }

    if (task.testStatus === "failed") {
      return "Execution blocked on failing tests.";
    }

    if (task.lintStatus === "failed") {
      return "Execution blocked on failing lint checks.";
    }

    if (task.errorMessage) {
      return task.errorMessage;
    }

    return "Execution failed before CodexFlow could complete verification.";
  }

  if (task.status === "needs_review") {
    return task.failureSignal?.summary || "Patch preview is ready, but a human should review it before trust.";
  }

  if (task.status === "passed") {
    return task.latestEvent?.detail || "Verification passed and the patch preview is ready to land.";
  }

  if (task.status === "running") {
    if (task.latestEvent?.detail) {
      return task.latestEvent.detail;
    }

    if (task.runStartedAt) {
      return "Execution is live: CodexFlow is building context, previewing the patch, and running verification.";
    }

    return "Queued work has been accepted and is preparing to run.";
  }

  return "Queued for repository scan, prompt construction, and patch-preview-first execution.";
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function getFirstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function getFirstValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (key in record) {
      return record[key];
    }
  }

  return undefined;
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

function toOptionalTaskStatus(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.toLowerCase();
  if (["queued", "running", "passed", "failed", "needs_review", "needs review"].includes(normalized)) {
    return toTaskStatus(value);
  }

  return undefined;
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

    if (!isRecord(entry)) {
      continue;
    }

    const path =
      (typeof entry.path === "string" && entry.path) ||
      (typeof entry.file === "string" && entry.file) ||
      (typeof entry.name === "string" && entry.name) ||
      "";

    if (!path) {
      continue;
    }

    const rawScore = entry.score ?? entry.relevance ?? entry.weight;
    selected.push({
      path,
      score: typeof rawScore === "number" ? rawScore : null,
      rationale: typeof entry.rationale === "string" ? entry.rationale : undefined,
      matchedTerms: Array.isArray(entry.matchedTerms)
        ? entry.matchedTerms.filter((value): value is string => typeof value === "string")
        : Array.isArray(entry.matched_terms)
          ? entry.matched_terms.filter((value): value is string => typeof value === "string")
          : undefined,
      excerpt: typeof entry.excerpt === "string" ? entry.excerpt : undefined,
    });
  }

  return selected;
}

function joinLogParts(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join("\n\n");
}

function toTimelineEventKind(value: unknown): TaskTimelineEventKind {
  switch (typeof value === "string" ? value.toLowerCase() : "") {
    case "task":
    case "context":
    case "execution":
    case "verification":
    case "failure":
    case "system":
      return value as TaskTimelineEventKind;
    case "log":
    case "logs":
    case "output":
      return "system";
    case "verify":
    case "checks":
      return "verification";
    case "error":
      return "failure";
    default:
      return "system";
  }
}

function toFailureClassification(value: unknown): FailureSignalClassification {
  switch (typeof value === "string" ? value.toLowerCase() : "") {
    case "execution":
    case "runtime":
      return "execution";
    case "lint":
    case "lint_failed":
      return "lint";
    case "test":
    case "tests":
    case "test_failed":
      return "test";
    case "verification":
    case "review":
    case "needs_review":
      return "verification";
    case "context":
    case "selection":
      return "context";
    case "infra":
    case "infrastructure":
    case "system":
      return "infrastructure";
    default:
      return "unknown";
  }
}

function normalizeTimelineEvent(entry: unknown, index: number): TaskTimelineEvent | null {
  if (typeof entry === "string") {
    const label = entry.trim();
    if (!label) {
      return null;
    }

    return {
      id: `timeline-${index}`,
      kind: "system",
      label,
    };
  }

  if (!isRecord(entry)) {
    return null;
  }

  const label =
    getFirstString(entry, ["label", "title", "summary", "event", "name", "phase"]) ||
    getFirstString(entry, ["message", "status"]);
  const detail = getFirstString(entry, ["detail", "description", "output", "notes", "context", "message", "error"]);

  if (!label && !detail) {
    return null;
  }

  return {
    id: getFirstString(entry, ["id", "eventId", "event_id"]) || `timeline-${index}`,
    kind: toTimelineEventKind(getFirstValue(entry, ["kind", "type", "category"])),
    label: label || detail || "Task updated",
    detail: detail && detail !== label ? detail : undefined,
    status: toOptionalTaskStatus(getFirstValue(entry, ["status", "taskStatus", "task_status"])),
    createdAt: getFirstString(entry, ["createdAt", "created_at", "timestamp", "time", "at", "occurredAt", "occurred_at"]),
    source: getFirstString(entry, ["source", "stage", "step"]),
  };
}

function toTimelineEvents(value: unknown): TaskTimelineEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const events = value
    .map((entry, index) => normalizeTimelineEvent(entry, index))
    .filter((entry): entry is TaskTimelineEvent => Boolean(entry));

  const seen = new Set<string>();
  return events.filter((event) => {
    const key = `${event.label}::${event.detail ?? ""}::${event.createdAt ?? ""}::${event.kind}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function normalizeFailureSignal(
  value: unknown,
  fallback: {
    status: TaskStatus;
    lintStatus: VerificationStatus;
    testStatus: VerificationStatus;
    errorMessage: string | null;
    verificationNotes: string;
  }
): TaskFailureSignal | null {
  if (typeof value === "string" && value.trim()) {
    return {
      classification: "execution",
      summary: value.trim(),
    };
  }

  if (isRecord(value)) {
    const summary = getFirstString(value, ["summary", "title", "message", "error", "label"]);
    const detail = getFirstString(value, ["detail", "description", "output", "notes"]);
    const action = getFirstString(value, ["action", "nextStep", "next_step", "recovery"]);

    if (summary || detail) {
      return {
        classification: toFailureClassification(getFirstValue(value, ["classification", "category", "type", "kind"])),
        summary: summary || detail || "Execution attention signal recorded.",
        detail: detail && detail !== summary ? detail : undefined,
        action,
        source: getFirstString(value, ["source", "stage", "step"]),
      };
    }
  }

  if (fallback.status === "needs_review") {
    return {
      classification: "verification",
      summary: fallback.verificationNotes || "Patch preview is ready but still needs manual review.",
      detail: fallback.errorMessage || undefined,
    };
  }

  if (fallback.status !== "failed") {
    return null;
  }

  if (fallback.testStatus === "failed") {
    return {
      classification: "test",
      summary: "Test suite failed during verification.",
      detail: fallback.errorMessage || undefined,
    };
  }

  if (fallback.lintStatus === "failed") {
    return {
      classification: "lint",
      summary: "Lint checks failed during verification.",
      detail: fallback.errorMessage || undefined,
    };
  }

  if (fallback.errorMessage) {
    return {
      classification: "execution",
      summary: fallback.errorMessage,
    };
  }

  return {
    classification: "unknown",
    summary: "Execution failed without a structured failure signal.",
  };
}

function buildFallbackTimeline(task: {
  status: TaskStatus;
  createdAt?: string;
  runStartedAt?: string | null;
  runFinishedAt?: string | null;
  updatedAt: string;
  lintStatus: VerificationStatus;
  testStatus: VerificationStatus;
  failureSignal: TaskFailureSignal | null;
}): TaskTimelineEvent[] {
  const events: TaskTimelineEvent[] = [];

  if (task.createdAt) {
    events.push({
      id: "queued-created",
      kind: "task",
      label: "Task queued",
      detail: "Task captured with repo path, prompt, and verification inputs.",
      status: "queued",
      createdAt: task.createdAt,
    });
  }

  if (task.runStartedAt) {
    events.push({
      id: "execution-started",
      kind: "execution",
      label: "Execution started",
      detail: "CodexFlow began assembling context and generating a patch preview.",
      status: "running",
      createdAt: task.runStartedAt,
    });
  }

  if (task.status === "running") {
    events.push({
      id: "verification-pending",
      kind: "verification",
      label: "Verification in progress",
      detail:
        task.lintStatus === "pending" && task.testStatus === "pending"
          ? "Lint and test checks are still running."
          : "Some verification signals have arrived while the run is still active.",
      status: "running",
      createdAt: task.updatedAt,
    });
  }

  if (task.status === "needs_review") {
    events.push({
      id: "review-ready",
      kind: "verification",
      label: "Awaiting review",
      detail: task.failureSignal?.summary || "Patch preview is ready for a human review pass.",
      status: "needs_review",
      createdAt: task.updatedAt,
    });
  }

  if (task.status === "passed") {
    events.push({
      id: "verification-passed",
      kind: "verification",
      label: "Verification passed",
      detail: "Lint and test checks cleared for the current patch preview.",
      status: "passed",
      createdAt: task.runFinishedAt || task.updatedAt,
    });
  }

  if (task.status === "failed") {
    events.push({
      id: "verification-failed",
      kind: task.failureSignal ? "failure" : "verification",
      label: "Execution failed",
      detail: task.failureSignal?.summary || "The run stopped before CodexFlow could produce a trusted result.",
      status: "failed",
      createdAt: task.runFinishedAt || task.updatedAt,
    });
  }

  if (events.length === 0) {
    events.push({
      id: "queued-fallback",
      kind: "task",
      label: "Task waiting to start",
      detail: "CodexFlow has not emitted execution milestones yet.",
      status: task.status,
      createdAt: task.updatedAt,
    });
  }

  return events;
}

function withFailureEvent(timeline: TaskTimelineEvent[], failureSignal: TaskFailureSignal | null, updatedAt: string) {
  if (!failureSignal) {
    return timeline;
  }

  if (timeline.some((event) => event.kind === "failure" || event.label === failureSignal.summary)) {
    return timeline;
  }

  return [
    ...timeline,
    {
      id: "failure-signal",
      kind: "failure",
      label: failureSignal.summary,
      detail: failureSignal.detail,
      createdAt: updatedAt,
      source: failureSignal.source,
    },
  ];
}

function normalizeTask(raw: unknown): TaskRecord {
  const record = isRecord(raw) ? raw : {};
  const verification = isRecord(record.verification) ? record.verification : {};
  const lint = isRecord(verification.lint) ? verification.lint : {};
  const tests = isRecord(verification.tests)
    ? verification.tests
    : isRecord(verification.test)
      ? verification.test
      : {};
  const execution = isRecord(record.execution) ? record.execution : {};

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

  const selectedFiles = [
    ...toSelectedFiles(record.selectedFiles),
    ...toSelectedFiles(record.selected_files),
    ...toSelectedFiles(record.files),
    ...toSelectedFiles(execution.selectedFiles),
  ].filter((file, index, array) => array.findIndex((candidate) => candidate.path === file.path) === index);

  const rawScore = record.score ?? verification.score ?? execution.score ?? null;
  const errorMessage =
    (typeof record.errorMessage === "string" && record.errorMessage) ||
    (typeof record.error_message === "string" && record.error_message) ||
    (typeof execution.error === "string" && execution.error) ||
    null;

  const failureSignal = normalizeFailureSignal(
    record.failureSignal ?? record.failure_signal ?? record.failure ?? execution.failureSignal ?? execution.failure_signal,
    {
      status,
      lintStatus,
      testStatus,
      errorMessage,
      verificationNotes:
        (typeof record.verificationNotes === "string" && record.verificationNotes) ||
        (typeof record.verification_notes === "string" && record.verification_notes) ||
        "",
    }
  );

  const createdAt =
    (typeof record.createdAt === "string" && record.createdAt) ||
    (typeof record.created_at === "string" && record.created_at) ||
    undefined;
  const updatedAt =
    (typeof record.updatedAt === "string" && record.updatedAt) ||
    (typeof record.updated_at === "string" && record.updated_at) ||
    createdAt ||
    new Date().toISOString();
  const runStartedAt =
    (typeof record.runStartedAt === "string" && record.runStartedAt) ||
    (typeof record.run_started_at === "string" && record.run_started_at) ||
    null;
  const runFinishedAt =
    (typeof record.runFinishedAt === "string" && record.runFinishedAt) ||
    (typeof record.run_finished_at === "string" && record.run_finished_at) ||
    null;

  const parsedTimeline = [
    ...toTimelineEvents(record.timeline),
    ...toTimelineEvents(record.executionTimeline),
    ...toTimelineEvents(record.execution_timeline),
    ...toTimelineEvents(record.taskEvents),
    ...toTimelineEvents(record.task_events),
    ...toTimelineEvents(record.events),
    ...toTimelineEvents(record.history),
    ...toTimelineEvents(execution.timeline),
    ...toTimelineEvents(execution.events),
    ...toTimelineEvents(verification.timeline),
  ];

  const fallbackTimeline = buildFallbackTimeline({
    status,
    createdAt,
    runStartedAt,
    runFinishedAt,
    updatedAt,
    lintStatus,
    testStatus,
    failureSignal,
  });

  const timeline = withFailureEvent(parsedTimeline.length > 0 ? parsedTimeline : fallbackTimeline, failureSignal, updatedAt);
  const latestEvent = timeline[timeline.length - 1] ?? null;

  const task: TaskRecord = {
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
    timeline,
    latestEvent,
    failureSignal,
    statusSummary: "",
    createdAt,
    updatedAt,
    runStartedAt,
    runFinishedAt,
    errorMessage,
    repoPath:
      (typeof record.repoPath === "string" && record.repoPath) ||
      (typeof record.repo_path === "string" && record.repo_path) ||
      undefined,
  };

  task.statusSummary = getTaskStatusSummary(task);

  return task;
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
