import { randomUUID } from "node:crypto";

import { getDb } from "@/lib/db";
import { ensureSeedProjects, getDefaultProject, getProjectById } from "@/lib/server/project-store";
import type {
  CreateTaskInput,
  SelectedFile,
  TaskEvent,
  TaskFailureSignal,
  TaskKind,
  TaskRecord,
  TaskStatus,
} from "@/lib/task-types";

interface TaskRow {
  id: string;
  title: string;
  prompt: string;
  status: TaskStatus;
  project_id: string | null;
  project_name: string | null;
  task_kind: string;
  repo_path: string;
  created_at: string;
  updated_at: string;
  run_started_at: string | null;
  run_finished_at: string | null;
  score: number;
  selected_files_json: string;
  prompt_preview: string;
  context_summary: string;
  execution_mode: string;
  codex_output: string;
  diff_output: string;
  patch_summary: string;
  lint_status: TaskRecord["lintStatus"];
  test_status: TaskRecord["testStatus"];
  lint_output: string;
  test_output: string;
  verification_notes: string;
  logs: string;
  error_message: string | null;
  lint_command: string | null;
  test_command: string | null;
  timeline_json: string;
  failure_signal_json: string | null;
  board_position: number;
}

function createTimelineEvent(
  input: Omit<TaskEvent, "id"> & { id?: string }
): TaskEvent {
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

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeTimeline(value: unknown): TaskEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as Record<string, unknown>;
    const title = typeof record.title === "string" ? record.title : "Task update";
    const detail =
      (typeof record.detail === "string" && record.detail) ||
      (typeof record.message === "string" && record.message) ||
      "No additional detail captured.";
    const createdAt =
      (typeof record.createdAt === "string" && record.createdAt) ||
      (typeof record.created_at === "string" && record.created_at) ||
      new Date(0).toISOString();

    return [
      createTimelineEvent({
        id: typeof record.id === "string" ? record.id : undefined,
        phase:
          record.phase === "task" ||
            record.phase === "context" ||
            record.phase === "execution" ||
            record.phase === "verification"
            ? record.phase
            : "execution",
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
            : "run_completed",
        level:
          record.level === "info" ||
            record.level === "success" ||
            record.level === "warning" ||
            record.level === "error"
            ? record.level
            : "info",
        title,
        detail,
        createdAt,
        metadata:
          record.metadata && typeof record.metadata === "object"
            ? (record.metadata as TaskEvent["metadata"])
            : undefined,
      }),
    ];
  });
}

function normalizeFailureSignal(value: unknown): TaskFailureSignal | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const category =
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

function appendTaskEvent(task: TaskRecord, event: TaskEvent) {
  return [...task.timeline, event];
}

function normalizeTaskKind(value: string | null | undefined): TaskKind {
  return value === "task" || value === "report" || value === "issue" ? value : "issue";
}

const baseSeedTasks: Array<Omit<TaskRecord, "id" | "projectId" | "projectName">> = [
  {
    title: "Tighten the failed task-detail review state",
    prompt: "Improve the task detail view so failed runs surface retry guidance, verification status, and patch context without pushing the operator out of the review flow.",
    status: "needs_review",
    taskKind: "issue",
    repoPath: ".",
    createdAt: new Date("2026-04-15T10:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-04-15T10:02:00.000Z").toISOString(),
    runStartedAt: new Date("2026-04-15T10:00:30.000Z").toISOString(),
    runFinishedAt: new Date("2026-04-15T10:02:00.000Z").toISOString(),
    score: 58,
    selectedFiles: [
      {
        path: "features/dashboard/task-detail.tsx",
        score: 94,
        rationale: "The task detail route is the operator-facing review surface for failed runs and retry guidance.",
        matchedTerms: ["task detail", "review"],
      },
      {
        path: "components/VerificationPanel.tsx",
        score: 88,
        rationale: "Verification output needs to stay visible alongside the retry path when a run fails.",
        matchedTerms: ["verification", "failed"],
      },
    ],
    promptPreview: "System instruction...\nTask title: Tighten the failed task-detail review state\nSelected context: task detail + verification panel",
    contextSummary: "CodexFlow selected the task detail screen and verification panel because both directly shape how operators review failed runs before retrying.",
    executionMode: "mock",
    codexOutput: "Mock execution completed without a live OpenAI key. Review the diff before applying it.",
    diffOutput: "diff --git a/features/dashboard/task-detail.tsx b/features/dashboard/task-detail.tsx\n@@\n+// Keep retry guidance and verification evidence visible in the failed-state review flow\n",
    patchSummary: "Keep failed-run review context visible in task detail before retrying.",
    lintStatus: "pending",
    testStatus: "pending",
    lintOutput: "Lint was not executed for the seed demo task.",
    testOutput: "Tests were not executed for the seed demo task.",
    verificationNotes: "Patch preview generated, but verification is still pending human review.",
    logs: "Queued sample issue for the board demo.",
    errorMessage: null,
    lintCommand: null,
    testCommand: null,
    timeline: [
      createTimelineEvent({
        phase: "task",
        kind: "task_created",
        level: "info",
        title: "Issue created",
        detail: "Issue captured with repo path and verification commands.",
        createdAt: new Date("2026-04-15T10:00:00.000Z").toISOString(),
      }),
      createTimelineEvent({
        phase: "execution",
        kind: "run_started",
        level: "info",
        title: "Run started",
        detail: "CodexFlow started a preview-first execution for the issue.",
        createdAt: new Date("2026-04-15T10:00:30.000Z").toISOString(),
      }),
      createTimelineEvent({
        phase: "context",
        kind: "context_selected",
        level: "success",
        title: "Context selected",
        detail: "Ranked 2 files for prompt context before patch generation.",
        createdAt: new Date("2026-04-15T10:01:00.000Z").toISOString(),
        metadata: { selectedFiles: 2 },
      }),
      createTimelineEvent({
        phase: "execution",
        kind: "patch_generated",
        level: "success",
        title: "Patch preview ready",
        detail: "A diff preview was produced and is ready for human review.",
        createdAt: new Date("2026-04-15T10:01:30.000Z").toISOString(),
      }),
      createTimelineEvent({
        phase: "verification",
        kind: "verification_completed",
        level: "warning",
        title: "Verification pending",
        detail: "Lint and tests were not run for this sample issue.",
        createdAt: new Date("2026-04-15T10:02:00.000Z").toISOString(),
      }),
    ],
    failureSignal: null,
    boardPosition: 0,
  },
  {
    title: "Ship onboarding report for repo operators",
    prompt: "Create a concise onboarding report that explains how repo operators should create issues, reports, and implementation tasks inside CodexFlow.",
    status: "passed",
    taskKind: "report",
    repoPath: ".",
    createdAt: new Date("2026-04-14T12:15:00.000Z").toISOString(),
    updatedAt: new Date("2026-04-14T12:18:00.000Z").toISOString(),
    runStartedAt: new Date("2026-04-14T12:15:30.000Z").toISOString(),
    runFinishedAt: new Date("2026-04-14T12:18:00.000Z").toISOString(),
    score: 92,
    selectedFiles: [
      {
        path: "app/onboarding/page.tsx",
        score: 97,
        rationale: "The onboarding route is the strongest surface for operator guidance and report framing.",
        matchedTerms: ["onboarding", "report"],
      },
      {
        path: "README.md",
        score: 82,
        rationale: "Repo-level docs help validate the report content and operator workflow framing.",
        matchedTerms: ["report", "operators"],
      },
    ],
    promptPreview: "System instruction...\nTask title: Ship onboarding report for repo operators\nSelected context: onboarding route + README",
    contextSummary: "The onboarding route was ranked highest because it holds the guided operator flow, while the README validates the report language.",
    executionMode: "mock",
    codexOutput: "Generated a small report patch and verification passed.",
    diffOutput: "diff --git a/README.md b/README.md\n@@\n+## Operator report\n+Explain how to open issues, reports, and tasks in CodexFlow.\n",
    patchSummary: "Add operator-facing workflow guidance for issues, reports, and tasks.",
    lintStatus: "passed",
    testStatus: "passed",
    lintOutput: "✓ No ESLint warnings or errors",
    testOutput: "✓ UI regression checks passed",
    verificationNotes: "Verification cleared both lint and tests, so the report landed in passed.",
    logs: "✓ Lint passed\n✓ Tests passed\n✓ Patch preview generated",
    errorMessage: null,
    lintCommand: null,
    testCommand: null,
    timeline: [
      createTimelineEvent({
        phase: "task",
        kind: "task_created",
        level: "info",
        title: "Report created",
        detail: "Report queued for execution with verification commands.",
        createdAt: new Date("2026-04-14T12:15:00.000Z").toISOString(),
      }),
      createTimelineEvent({
        phase: "execution",
        kind: "run_started",
        level: "info",
        title: "Run started",
        detail: "CodexFlow began scanning the repository before prompt construction.",
        createdAt: new Date("2026-04-14T12:15:30.000Z").toISOString(),
      }),
      createTimelineEvent({
        phase: "context",
        kind: "context_selected",
        level: "success",
        title: "Context selected",
        detail: "The onboarding route and README ranked highest for the report prompt.",
        createdAt: new Date("2026-04-14T12:16:00.000Z").toISOString(),
        metadata: { selectedFiles: 2 },
      }),
      createTimelineEvent({
        phase: "execution",
        kind: "patch_generated",
        level: "success",
        title: "Patch preview ready",
        detail: "A targeted diff was produced for inspection before trust.",
        createdAt: new Date("2026-04-14T12:16:45.000Z").toISOString(),
      }),
      createTimelineEvent({
        phase: "verification",
        kind: "verification_completed",
        level: "success",
        title: "Verification passed",
        detail: "Lint and tests both passed for the generated report preview.",
        createdAt: new Date("2026-04-14T12:18:00.000Z").toISOString(),
      }),
      createTimelineEvent({
        phase: "task",
        kind: "run_completed",
        level: "success",
        title: "Run completed",
        detail: "The report completed successfully with a verified patch preview.",
        createdAt: new Date("2026-04-14T12:18:00.000Z").toISOString(),
      }),
    ],
    failureSignal: null,
    boardPosition: 1000,
  },
  {
    title: "Implement project creation flow",
    prompt: "Add a real project creation flow so operators can group issues and reports before assigning them in the board.",
    status: "failed",
    taskKind: "task",
    repoPath: ".",
    createdAt: new Date("2026-04-13T08:30:00.000Z").toISOString(),
    updatedAt: new Date("2026-04-13T08:36:00.000Z").toISOString(),
    runStartedAt: new Date("2026-04-13T08:31:00.000Z").toISOString(),
    runFinishedAt: new Date("2026-04-13T08:36:00.000Z").toISOString(),
    score: 34,
    selectedFiles: [
      {
        path: "app/projects/page.tsx",
        score: 96,
        rationale: "The projects page directly controls the operator flow for project creation and grouping.",
        matchedTerms: ["project", "creation"],
      },
      {
        path: "components/CreateTaskModal.tsx",
        score: 75,
        rationale: "Task creation needs project assignment if project grouping is going to work end to end.",
        matchedTerms: ["project", "task"],
      },
    ],
    promptPreview: "System instruction...\nTask title: Implement project creation flow\nSelected context: projects page + task modal",
    contextSummary: "CodexFlow prioritized the projects page and task modal because both are required for a working project-aware kanban flow.",
    executionMode: "mock",
    codexOutput: "Attempted project flow update, but verification failed.",
    diffOutput: "diff --git a/app/projects/page.tsx b/app/projects/page.tsx\n@@\n+// Persist new project cards and counts\n",
    patchSummary: "Add a persistent project creation and board-grouping flow.",
    lintStatus: "failed",
    testStatus: "failed",
    lintOutput: "app/projects/page.tsx: form state was incomplete",
    testOutput: "Project creation smoke path failed to save the new project.",
    verificationNotes: "The patch preview exists, but verification failed and the task requires investigation.",
    logs: "Command failed: project creation hit a missing persistence path during verification.",
    errorMessage: "Verification failed during sample seed generation.",
    lintCommand: null,
    testCommand: null,
    timeline: [
      createTimelineEvent({
        phase: "task",
        kind: "task_created",
        level: "info",
        title: "Task created",
        detail: "Task queued for execution with project-focused verification.",
        createdAt: new Date("2026-04-13T08:30:00.000Z").toISOString(),
      }),
      createTimelineEvent({
        phase: "execution",
        kind: "run_started",
        level: "info",
        title: "Run started",
        detail: "CodexFlow started scanning repository files.",
        createdAt: new Date("2026-04-13T08:31:00.000Z").toISOString(),
      }),
      createTimelineEvent({
        phase: "context",
        kind: "context_selected",
        level: "success",
        title: "Context selected",
        detail: "The projects page and task modal were selected for prompt context.",
        createdAt: new Date("2026-04-13T08:32:00.000Z").toISOString(),
        metadata: { selectedFiles: 2 },
      }),
      createTimelineEvent({
        phase: "execution",
        kind: "patch_generated",
        level: "warning",
        title: "Patch preview ready",
        detail: "A patch preview was generated, but verification still needed to run.",
        createdAt: new Date("2026-04-13T08:33:00.000Z").toISOString(),
      }),
      createTimelineEvent({
        phase: "verification",
        kind: "verification_completed",
        level: "error",
        title: "Verification failed",
        detail: "Lint and tests both failed after preview generation.",
        createdAt: new Date("2026-04-13T08:36:00.000Z").toISOString(),
      }),
      createTimelineEvent({
        phase: "task",
        kind: "run_failed",
        level: "error",
        title: "Run failed",
        detail: "The task ended in a failed state and needs investigation.",
        createdAt: new Date("2026-04-13T08:36:00.000Z").toISOString(),
      }),
    ],
    failureSignal: {
      category: "verification",
      summary: "Verification failed after patch generation",
      detail: "The generated preview existed, but lint and test checks both failed for the project flow update.",
      detectedAt: new Date("2026-04-13T08:36:00.000Z").toISOString(),
    },
    boardPosition: 2000,
  },
];

function rowToTask(row: TaskRow): TaskRecord {
  return {
    id: row.id,
    title: row.title,
    prompt: row.prompt,
    status: row.status,
    taskKind: normalizeTaskKind(row.task_kind),
    projectId: row.project_id,
    projectName: row.project_name,
    repoPath: row.repo_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    runStartedAt: row.run_started_at,
    runFinishedAt: row.run_finished_at,
    score: row.score,
    selectedFiles: parseJson(row.selected_files_json, []) as SelectedFile[],
    promptPreview: row.prompt_preview,
    contextSummary: row.context_summary,
    executionMode: row.execution_mode,
    codexOutput: row.codex_output,
    diffOutput: row.diff_output,
    patchSummary: row.patch_summary,
    lintStatus: row.lint_status,
    testStatus: row.test_status,
    lintOutput: row.lint_output,
    testOutput: row.test_output,
    verificationNotes: row.verification_notes,
    logs: row.logs,
    errorMessage: row.error_message,
    lintCommand: row.lint_command,
    testCommand: row.test_command,
    timeline: normalizeTimeline(parseJson(row.timeline_json, [])),
    failureSignal: normalizeFailureSignal(parseJson(row.failure_signal_json, null)),
    boardPosition: Number(row.board_position) || 0,
  };
}

function taskToParams(task: TaskRecord) {
  return {
    id: task.id,
    title: task.title,
    prompt: task.prompt,
    status: task.status,
    project_id: task.projectId,
    task_kind: task.taskKind,
    repo_path: task.repoPath,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
    run_started_at: task.runStartedAt,
    run_finished_at: task.runFinishedAt,
    score: task.score,
    selected_files_json: JSON.stringify(task.selectedFiles),
    prompt_preview: task.promptPreview,
    context_summary: task.contextSummary,
    execution_mode: task.executionMode,
    codex_output: task.codexOutput,
    diff_output: task.diffOutput,
    patch_summary: task.patchSummary,
    lint_status: task.lintStatus,
    test_status: task.testStatus,
    lint_output: task.lintOutput,
    test_output: task.testOutput,
    verification_notes: task.verificationNotes,
    logs: task.logs,
    error_message: task.errorMessage,
    lint_command: task.lintCommand,
    test_command: task.testCommand,
    timeline_json: JSON.stringify(task.timeline),
    failure_signal_json: task.failureSignal ? JSON.stringify(task.failureSignal) : null,
    board_position: task.boardPosition,
  };
}

export function ensureSeedTasks() {
  ensureSeedProjects();
  const db = getDb();
  const count = (db.prepare("SELECT COUNT(*) as count FROM tasks").get() as { count: number }).count;

  if (count > 0) {
    return;
  }

  const defaultProject = getDefaultProject();

  const insert = db.prepare(`
    INSERT INTO tasks (
      id, title, prompt, status, project_id, task_kind, repo_path, created_at, updated_at, run_started_at, run_finished_at,
      score, selected_files_json, prompt_preview, context_summary, execution_mode, codex_output, diff_output, patch_summary,
      lint_status, test_status, lint_output, test_output, verification_notes, logs,
      error_message, lint_command, test_command, timeline_json, failure_signal_json, board_position
    ) VALUES (
      :id, :title, :prompt, :status, :project_id, :task_kind, :repo_path, :created_at, :updated_at, :run_started_at, :run_finished_at,
      :score, :selected_files_json, :prompt_preview, :context_summary, :execution_mode, :codex_output, :diff_output, :patch_summary,
      :lint_status, :test_status, :lint_output, :test_output, :verification_notes, :logs,
      :error_message, :lint_command, :test_command, :timeline_json, :failure_signal_json, :board_position
    )
  `);

  for (let i = 0; i < baseSeedTasks.length; i++) {
    const task = baseSeedTasks[i];
    if (task) {
      insert.run(taskToParams({
        ...task,
        id: randomUUID(),
        projectId: defaultProject?.id ?? null,
        projectName: defaultProject?.name ?? null,
        boardPosition: i * 1000,
      }));
    }
  }
}

function selectTasksSql(whereClause = "", orderClause = "ORDER BY t.updated_at DESC") {
  return `
    SELECT t.*, p.name AS project_name
    FROM tasks t
    LEFT JOIN projects p ON p.id = t.project_id
    ${whereClause}
    ${orderClause}
  `;
}

export function listTasks() {
  ensureSeedTasks();
  const db = getDb();
  const rows = db.prepare(selectTasksSql()).all() as TaskRow[];
  return rows.map(rowToTask);
}

export function getTaskById(id: string) {
  ensureSeedTasks();
  const db = getDb();
  const row = db.prepare(selectTasksSql("WHERE t.id = ?", "")).get(id) as TaskRow | undefined;
  return row ? rowToTask(row) : null;
}

export function createTask(input: CreateTaskInput) {
  ensureSeedTasks();
  const db = getDb();
  const now = new Date().toISOString();
  const project = input.projectId ? getProjectById(input.projectId) : null;
  const taskKind = normalizeTaskKind(input.taskKind);
  const taskLabel = taskKind === "issue" ? "Issue" : taskKind === "report" ? "Report" : "Task";

  const task: TaskRecord = {
    id: randomUUID(),
    title: input.title.trim(),
    prompt: input.prompt.trim(),
    status: "queued",
    taskKind,
    projectId: project?.id ?? null,
    projectName: project?.name ?? null,
    repoPath: input.repoPath?.trim() || ".",
    createdAt: now,
    updatedAt: now,
    runStartedAt: null,
    runFinishedAt: null,
    score: 0,
    selectedFiles: [],
    promptPreview: "",
    contextSummary: "",
    executionMode: "",
    codexOutput: "",
    diffOutput: "",
    patchSummary: "",
    lintStatus: "pending",
    testStatus: "pending",
    lintOutput: "",
    testOutput: "",
    verificationNotes: "Patch preview first. No repository changes are auto-applied.",
    logs: `${taskLabel} created and waiting to run. Patch previews are generated before any human review.`,
    errorMessage: null,
    lintCommand: input.lintCommand?.trim() || null,
    testCommand: input.testCommand?.trim() || null,
    timeline: [
      createTimelineEvent({
        phase: "task",
        kind: "task_created",
        level: "info",
        title: `${taskLabel} created`,
        detail: `${taskLabel} captured and queued for preview-first execution.`,
        createdAt: now,
        metadata: {
          hasLintCommand: Boolean(input.lintCommand?.trim()),
          hasTestCommand: Boolean(input.testCommand?.trim()),
          hasProject: Boolean(project),
        },
      }),
    ],
    failureSignal: null,
    boardPosition: 0,
  };
  db.prepare(`
    INSERT INTO tasks (
      id, title, prompt, status, project_id, task_kind, repo_path, created_at, updated_at, run_started_at, run_finished_at,
      score, selected_files_json, prompt_preview, context_summary, execution_mode, codex_output, diff_output, patch_summary,
      lint_status, test_status, lint_output, test_output, verification_notes, logs,
      error_message, lint_command, test_command, timeline_json, failure_signal_json, board_position
    ) VALUES (
      :id, :title, :prompt, :status, :project_id, :task_kind, :repo_path, :created_at, :updated_at, :run_started_at, :run_finished_at,
      :score, :selected_files_json, :prompt_preview, :context_summary, :execution_mode, :codex_output, :diff_output, :patch_summary,
      :lint_status, :test_status, :lint_output, :test_output, :verification_notes, :logs,
      :error_message, :lint_command, :test_command, :timeline_json, :failure_signal_json, :board_position
    )
  `).run(taskToParams(task));

  return task;
}

export function updateTask(id: string, updates: Partial<TaskRecord>) {
  const current = getTaskById(id);

  if (!current) {
    return null;
  }

  const next: TaskRecord = {
    ...current,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };

  getDb().prepare(`
    UPDATE tasks SET
  title = : title,
    prompt = : prompt,
      status = : status,
        project_id = : project_id,
          task_kind = : task_kind,
            repo_path = : repo_path,
              created_at = : created_at,
                updated_at = : updated_at,
                  run_started_at = : run_started_at,
                    run_finished_at = : run_finished_at,
                      score = : score,
                        selected_files_json = : selected_files_json,
                          prompt_preview = : prompt_preview,
                            context_summary = : context_summary,
                              execution_mode = : execution_mode,
                                codex_output = : codex_output,
                                  diff_output = : diff_output,
                                    patch_summary = : patch_summary,
                                      lint_status = : lint_status,
                                        test_status = : test_status,
                                          lint_output = : lint_output,
                                            test_output = : test_output,
                                              verification_notes = : verification_notes,
                                                logs = : logs,
                                                  error_message = : error_message,
                                                    lint_command = : lint_command,
                                                      test_command = : test_command,
                                                        timeline_json = : timeline_json,
                                                          failure_signal_json = : failure_signal_json,
                                                            board_position = : board_position
    WHERE id = : id
  `).run(taskToParams(next));

  return next;
}

export function resetTaskForRetry(id: string) {
  const current = getTaskById(id);

  if (!current) {
    return null;
  }

  return updateTask(id, {
    status: "queued",
    score: 0,
    selectedFiles: [],
    promptPreview: "",
    contextSummary: "",
    executionMode: "",
    codexOutput: "",
    diffOutput: "",
    patchSummary: "",
    lintStatus: "pending",
    testStatus: "pending",
    lintOutput: "",
    testOutput: "",
    verificationNotes: "Task re-queued. A fresh patch preview will be generated before trust.",
    logs: `${current.taskKind === "issue" ? "Issue" : current.taskKind === "report" ? "Report" : "Task"} queued for retry.CodexFlow will rescan the repository and generate a fresh patch preview.`,
    errorMessage: null,
    runStartedAt: null,
    runFinishedAt: null,
    timeline: appendTaskEvent(
      current,
      createTimelineEvent({
        phase: "task",
        kind: "task_requeued",
        level: "info",
        title: "Task re-queued",
        detail: "A fresh preview-first run was requested.",
        createdAt: new Date().toISOString(),
      })
    ),
    failureSignal: null,
  });
}

export function getTaskTimeline(id: string) {
  const task = getTaskById(id);

  if (!task) {
    return null;
  }

  return {
    taskId: task.id,
    status: task.status,
    timeline: task.timeline,
    failureSignal: task.failureSignal,
  };
}

export function moveTask(id: string, status: TaskStatus, boardPosition: number) {
  const current = getTaskById(id);

  if (!current) {
    return null;
  }

  return updateTask(id, {
    status,
    boardPosition,
    timeline: appendTaskEvent(
      current,
      createTimelineEvent({
        phase: "task",
        kind: "task_created", // reusing task kind for general updates
        level: "info",
        title: "Board status updated",
        detail: `Moved to ${status} on the board.`,
        createdAt: new Date().toISOString(),
      })
    ),
  });
}
