export type TaskStatus = "queued" | "running" | "passed" | "failed" | "needs_review";
export type TaskKind = "issue" | "report" | "task";
export type CheckStatus = "passed" | "failed" | "pending";
export type TaskEventPhase = "task" | "context" | "execution" | "verification";
export type TaskEventLevel = "info" | "success" | "warning" | "error";
export type TaskEventKind =
  | "task_created"
  | "task_requeued"
  | "run_started"
  | "context_selected"
  | "patch_generated"
  | "verification_completed"
  | "run_completed"
  | "run_failed";
export type FailureCategory = "verification" | "execution" | "empty_patch" | "unknown";

export interface SelectedFile {
  path: string;
  score: number;
  excerpt?: string;
  rationale?: string;
  matchedTerms?: string[];
}

export interface TaskEvent {
  id: string;
  phase: TaskEventPhase;
  kind: TaskEventKind;
  level: TaskEventLevel;
  title: string;
  detail: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface TaskFailureSignal {
  category: FailureCategory;
  summary: string;
  detail: string;
  detectedAt: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  slug: string;
  repoPath: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  openTaskCount: number;
  lastActivityAt: string | null;
}

export interface TaskRecord {
  id: string;
  title: string;
  prompt: string;
  status: TaskStatus;
  taskKind: TaskKind;
  projectId: string | null;
  projectName: string | null;
  repoPath: string;
  createdAt: string;
  updatedAt: string;
  runStartedAt: string | null;
  runFinishedAt: string | null;
  score: number;
  selectedFiles: SelectedFile[];
  promptPreview: string;
  contextSummary: string;
  executionMode: string;
  codexOutput: string;
  diffOutput: string;
  patchSummary: string;
  lintStatus: CheckStatus;
  testStatus: CheckStatus;
  lintOutput: string;
  testOutput: string;
  verificationNotes: string;
  logs: string;
  errorMessage: string | null;
  lintCommand: string | null;
  testCommand: string | null;
  timeline: TaskEvent[];
  failureSignal: TaskFailureSignal | null;
  boardPosition: number;
}

export interface CreateTaskInput {
  title: string;
  prompt: string;
  projectId?: string;
  taskKind?: TaskKind;
  repoPath?: string;
  lintCommand?: string;
  testCommand?: string;
}

export interface CreateProjectInput {
  name: string;
  repoPath?: string;
  description?: string;
}

export interface RunTaskResult {
  status: TaskStatus;
  score: number;
  selectedFiles: SelectedFile[];
  promptPreview: string;
  contextSummary: string;
  executionMode: string;
  codexOutput: string;
  diffOutput: string;
  patchSummary: string;
  lintStatus: CheckStatus;
  testStatus: CheckStatus;
  lintOutput: string;
  testOutput: string;
  verificationNotes: string;
  logs: string;
  errorMessage?: string | null;
  timeline?: TaskEvent[];
  failureSignal?: TaskFailureSignal | null;
}
