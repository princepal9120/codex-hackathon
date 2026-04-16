"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronLeft,
  Copy,
  FileSearch,
  FolderGit2,
  ShieldCheck,
  Sparkles,
  Terminal,
  TerminalSquare,
  Workflow,
} from "lucide-react";

import {
  createTask,
  getTaskIdentifier,
  getTaskKindLabel,
  type CreateTaskInput,
  type TaskRecord,
  type TaskKind,
} from "@/components/task-api";
import { createProject, fetchProjects, type ProjectRecord } from "@/components/project-api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";

const steps = [
  { label: "Project", title: "Frame the repo" },
  { label: "Verification", title: "Lock the proof path" },
  { label: "First item", title: "Shape the request" },
  { label: "Launch", title: "Create the starter run" },
] as const;

const installCommands = [
  { label: "Check whether Multica is already installed", command: "multica version" },
  { label: "Install Multica with Homebrew", command: "brew install multica-ai/tap/multica" },
  { label: "Verify the Codex CLI is available", command: "codex --help" },
] as const;

const runtimeCommands = [
  { label: "Fastest path: configure + authenticate + start daemon", command: "multica setup" },
  { label: "Authenticate manually", command: "multica login" },
  { label: "Start the daemon manually", command: "multica daemon start" },
  { label: "Confirm daemon status and detected agents", command: "multica daemon status" },
] as const;

const detectedTools = ["Next.js 14", "TypeScript", "Python", "SQLite", "Codex"] as const;
const troubleshootingCommands = [
  { label: "Check current auth state", command: "multica auth status" },
  { label: "Restart daemon if Codex was not detected", command: "multica daemon stop && multica daemon start" },
] as const;

const optionalCliOverrides = [
  'export MULTICA_CODEX_PATH="$(which codex)"',
  'export MULTICA_CODEX_MODEL="gpt-5.4"',
] as const;

const starterTemplates = [
  {
    id: "review-path",
    name: "Review-path cleanup",
    description: "Tighten the proof around an existing surface without widening the product scope.",
    title: "Improve the failed-state review path on the task detail page",
    prompt:
      "Improve the failed-state experience on the task detail page. Keep the diff preview primary, make the retry path clearer, and preserve the existing API contract. Verification should prove the UI still builds cleanly.",
    outcome: "Great for a first end-to-end run that exercises the core review loop.",
    taskKind: "issue" as TaskKind,
  },
  {
    id: "feature-polish",
    name: "Feature polish",
    description: "Ship one focused product improvement with context selection and verification evidence.",
    title: "Add a clearer selected-file rationale summary to the board experience",
    prompt:
      "Add a clearer summary of why files were selected for a task, surface it on the board or task detail where it improves scanability, and keep the interface serious and proof-oriented. Verify the result with the configured checks.",
    outcome: "Highlights CodexFlow's repo-aware context differentiator immediately.",
    taskKind: "task" as TaskKind,
  },
  {
    id: "bug-fix",
    name: "Bug fix",
    description: "Investigate one concrete issue and require explicit proof before it can be trusted.",
    title: "Stabilize stale refresh flashes in the task detail loading state",
    prompt:
      "Investigate the task detail loading state so background refreshes do not flash stale or contradictory information. Keep the existing routes and API helpers intact, and verify the change with lint and tests.",
    outcome: "Useful when you want the first run to look like a real production bug investigation.",
    taskKind: "issue" as TaskKind,
  },
  {
    id: "operator-report",
    name: "Operator report",
    description: "Write or refine onboarding guidance so the Multica + Codex handoff feels concrete and operational.",
    title: "Document the Multica + Codex onboarding path for repo operators",
    prompt:
      "Create or refine onboarding guidance so repo operators can verify the Codex CLI, install Multica if needed, log in, start the daemon, and understand how CodexFlow hands off into the board and task-detail review flow. Keep the output serious, concrete, and proof-oriented.",
    outcome: "Best when you want the first run to look like an operator-facing report or docs deliverable.",
    taskKind: "report" as TaskKind,
  },
] as const;

const safeDefaults = {
  repoPath: ".",
  lintCommand: "npm run lint",
  testCommand: "python3 -m unittest discover -s tests",
} satisfies Required<Pick<CreateTaskInput, "repoPath" | "lintCommand" | "testCommand">>;

export default function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [projectName, setProjectName] = useState("CodexFlow onboarding");
  const [repoPath, setRepoPath] = useState(safeDefaults.repoPath);
  const [reviewOwner, setReviewOwner] = useState("Repo operator");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(starterTemplates[0].id);
  const [taskTitle, setTaskTitle] = useState<string>(starterTemplates[0].title);
  const [taskPrompt, setTaskPrompt] = useState<string>(starterTemplates[0].prompt);
  const [createdProject, setCreatedProject] = useState<ProjectRecord | null>(null);
  const [createdTask, setCreatedTask] = useState<TaskRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedTemplate = useMemo(
    () => starterTemplates.find((template) => template.id === selectedTemplateId) ?? starterTemplates[0],
    [selectedTemplateId]
  );

  const canAdvanceProject = projectName.trim().length > 0 && repoPath.trim().length > 0 && reviewOwner.trim().length > 0;
  const canAdvanceTask = taskTitle.trim().length > 0 && taskPrompt.trim().length > 0;

  const resetLaunchResult = () => {
    setCreatedProject(null);
    setCreatedTask(null);
    setSubmitError(null);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = starterTemplates.find((item) => item.id === templateId);
    if (!template) return;

    setSelectedTemplateId(template.id);
    setTaskTitle(template.title);
    setTaskPrompt(template.prompt);
    resetLaunchResult();
  };

  const goNext = () => {
    setStep((current) => Math.min(current + 1, steps.length - 1));
    setSubmitError(null);
  };

  const goBack = () => {
    setStep((current) => Math.max(current - 1, 0));
    setSubmitError(null);
  };

  const handleCreateStarterTask = async () => {
    if (!canAdvanceTask || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const normalizedProjectName = projectName.trim();
      const normalizedRepoPath = repoPath.trim() || safeDefaults.repoPath;
      const onboardingProjectDescription = `Onboarding project for ${reviewOwner.trim()} created from the guided CodexFlow setup flow.`;

      let project =
        (await fetchProjects()).find(
          (candidate) =>
            candidate.name.toLowerCase() === normalizedProjectName.toLowerCase() &&
            candidate.repoPath === normalizedRepoPath
        ) ?? null;

      if (!project) {
        project = await createProject({
          name: normalizedProjectName,
          repoPath: normalizedRepoPath,
          description: onboardingProjectDescription,
        });
      }

      const task = await createTask({
        title: taskTitle.trim(),
        prompt: taskPrompt.trim(),
        projectId: project.id,
        taskKind: selectedTemplate.taskKind,
        repoPath: normalizedRepoPath,
        lintCommand: safeDefaults.lintCommand,
        testCommand: safeDefaults.testCommand,
      });

      setCreatedProject(project);
      setCreatedTask(task);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create the starter task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="px-6 py-10">
      <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="surface-soft h-fit rounded-[2rem] p-6 sm:p-8 xl:sticky xl:top-8">
          <p className="font-mono-ui text-[0.68rem] uppercase tracking-[0.28em] text-[#7b8794]">Onboarding</p>
          <h1 className="font-display mt-4 text-balance text-4xl leading-[0.94] text-[#171717] sm:text-5xl">
            Bring the first CodexFlow run online with the same guided feel as Multica.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-[#5f6b78]">
            This onboarding wizard borrows Multica&apos;s step-by-step structure, but it is tuned for CodexFlow&apos;s
            real workflow: project setup, repo scope, verification defaults, first-item shaping, and a clean handoff
            into review.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/">
              <Button variant="outline">Back to landing</Button>
            </Link>
            <Link href="/board">
              <Button className="gap-2">
                Open board
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-8 rounded-[1.6rem] border border-[#e6ded3] bg-white p-5 shadow-[0_16px_30px_rgba(31,24,18,0.05)]">
            <p className="font-mono-ui text-[0.68rem] uppercase tracking-[0.24em] text-[#8b8378]">Guided steps</p>
            <div className="mt-5 space-y-4">
              {steps.map((item, index) => {
                const isActive = index === step;
                const isComplete = index < step || (index === step && createdTask && index === steps.length - 1);

                return (
                  <div key={item.label} className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                        isComplete
                          ? "border-[#1f7a68] bg-[#e7f6f0] text-[#14594c]"
                          : isActive
                            ? "border-[#1f1c17] bg-[#1f1c17] text-white"
                            : "border-[#ddd4c8] bg-[#faf6f0] text-[#8c8377]"
                      )}
                    >
                      {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                    </div>
                    <div className="pt-0.5">
                      <p className={cn("text-sm font-semibold", isActive ? "text-[#1f1c17]" : "text-[#6f675d]")}>{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-[#8b8378]">{item.title}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 rounded-[1.6rem] border border-[#e6ded3] bg-[#fcfaf6] p-5">
            <p className="font-mono-ui text-[0.68rem] uppercase tracking-[0.24em] text-[#8b8378]">Runtime cues</p>
            <div className="mt-4 space-y-3">
              {installCommands.slice(0, 2).map((item) => (
                <div key={item.command} className="rounded-[1.2rem] border border-[#e6ded3] bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8b8378]">{item.label}</p>
                  <code className="mt-2 block font-mono-ui text-sm text-[#1f1c17]">{item.command}</code>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {detectedTools.map((tool) => (
                <span
                  key={tool}
                  className="rounded-full border border-[#d8eee7] bg-[#effaf6] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[#21695c]"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="surface-panel rounded-[2rem] p-6 sm:p-8">
          <ProgressStepper activeStep={step} hasCompletion={Boolean(createdTask)} />

          {step === 0 ? (
            <StepShell
              eyebrow="Step 1"
              title="Create the CodexFlow project context"
              description="Multica starts by anchoring the workspace. Here, we anchor the project, the repo target, and the human who will judge the first run."
            >
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-5">
                  <Field label="Project name" helper="This is persisted as a real CodexFlow project before the starter item is created.">
                    <Input
                      value={projectName}
                      onChange={(event) => {
                        setProjectName(event.target.value);
                        resetLaunchResult();
                      }}
                      placeholder="CodexFlow onboarding"
                    />
                  </Field>
                  <Field label="Repository path" helper="Must stay inside the configured repo root. Use `.` for the current project.">
                    <Input
                      value={repoPath}
                      onChange={(event) => {
                        setRepoPath(event.target.value);
                        resetLaunchResult();
                      }}
                      placeholder="."
                    />
                  </Field>
                  <Field label="Review owner" helper="Who is responsible for reviewing the patch preview and verification evidence?">
                    <Input
                      value={reviewOwner}
                      onChange={(event) => {
                        setReviewOwner(event.target.value);
                        resetLaunchResult();
                      }}
                      placeholder="Repo operator"
                    />
                  </Field>
                </div>

                <InfoPanel
                  title="What this step controls"
                  body="CodexFlow creates or reuses a real project here, then attaches the starter issue, report, or implementation task to that project before handing off into the board."
                  items={[
                    "Scope the first run to the right repo root.",
                    "Keep the review owner explicit from the start.",
                    "Make the onboarding handoff land in a project-backed workflow, not a disconnected demo.",
                  ]}
                />
              </div>

              <StepActions>
                <Link href="/">
                  <Button variant="ghost">Cancel</Button>
                </Link>
                <Button onClick={goNext} disabled={!canAdvanceProject} className="gap-2">
                  Continue to verification
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </StepActions>
            </StepShell>
          ) : null}

          {step === 1 ? (
            <StepShell
              eyebrow="Step 2"
              title="Lock the proof path before the first run"
              description="This mirrors Multica&apos;s CLI_INSTALL + CLI_AND_DAEMON flow: verify the CLIs, authenticate, start the daemon, and make the proof path explicit before any patch preview earns trust."
            >
              <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-4">
                  <ReadonlyStat
                    icon={<FolderGit2 className="h-4 w-4" />}
                    label="Repo target"
                    value={repoPath.trim() || "."}
                    helper="Stored on the task and validated against the configured root."
                  />
                  <ReadonlyStat
                    icon={<ShieldCheck className="h-4 w-4" />}
                    label="Lint command"
                    value={safeDefaults.lintCommand}
                    helper="Locked to the configured safe command."
                  />
                  <ReadonlyStat
                    icon={<TerminalSquare className="h-4 w-4" />}
                    label="Test command"
                    value={safeDefaults.testCommand}
                    helper="Used to prove the patch preview still respects the codebase."
                  />
                </div>

                <div className="rounded-[1.5rem] border border-[#e6ded3] bg-[#faf6f0] p-5">
                  <p className="font-mono-ui text-[0.68rem] uppercase tracking-[0.24em] text-[#8b8378]">Detected stack</p>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {detectedTools.map((tool) => (
                      <span key={tool} className="rounded-full border border-[#e3ddd2] bg-white px-3 py-1 text-xs text-[#5b5348]">
                        {tool}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 space-y-3">
                    <ChecklistRow>Patch preview remains review-first, not auto-apply.</ChecklistRow>
                    <ChecklistRow>Verification stays visible and explicit from the first run.</ChecklistRow>
                    <ChecklistRow>Commands stay constrained to the safe configured defaults.</ChecklistRow>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
                <div className="rounded-[1.5rem] border border-[#e6ded3] bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-[#746b60]">
                    <Terminal className="h-4 w-4" />
                    <p className="text-[0.68rem] uppercase tracking-[0.24em]">Install + connect the runtime</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {installCommands.map((item, index) => (
                      <CommandBlock key={item.command} label={`${index + 1}. ${item.label}`} command={item.command} />
                    ))}
                    {runtimeCommands.map((item, index) => (
                      <CommandBlock key={item.command} label={`${index + installCommands.length + 1}. ${item.label}`} command={item.command} />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#6f675d]">
                    This mirrors Multica&apos;s onboarding rhythm directly: check the CLI, install if needed, authenticate,
                    start the daemon, confirm detected agents, then let the CodexFlow board/detail flow prove the handoff.
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-[#e6ded3] bg-[#faf6f0] p-5">
                  <div className="flex items-center gap-2 text-[#746b60]">
                    <Bot className="h-4 w-4" />
                    <p className="text-[0.68rem] uppercase tracking-[0.24em]">Troubleshooting + Codex overrides</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {troubleshootingCommands.map((item) => (
                      <CommandBlock key={item.command} label={item.label} command={item.command} subtle />
                    ))}
                    {optionalCliOverrides.map((command) => (
                      <CommandBlock key={command} label="Optional environment override" command={command} subtle />
                    ))}
                  </div>
                  <div className="mt-5 space-y-3">
                    <ChecklistRow>`multica setup` is the fastest path when you want the exact Cloud quickstart flow from Multica.</ChecklistRow>
                    <ChecklistRow>If `codex` is missing from daemon status, restart the daemon after fixing PATH or `MULTICA_CODEX_PATH`.</ChecklistRow>
                    <ChecklistRow>Use CodexFlow&apos;s starter item to prove repo context, prompt preview, and verification in one pass.</ChecklistRow>
                  </div>
                </div>
              </div>

              <StepActions>
                <Button variant="ghost" onClick={goBack} className="gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={goNext} className="gap-2">
                  Continue to first task
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </StepActions>
            </StepShell>
          ) : null}

          {step === 2 ? (
            <StepShell
              eyebrow="Step 3"
              title="Shape the first work item like a real operator"
              description="Instead of creating an agent like Multica, CodexFlow lets you choose a starter issue, task, or report pattern, then edit the exact request that will drive context selection and verification."
            >
              <div className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-3">
                  {starterTemplates.map((template) => {
                    const isSelected = template.id === selectedTemplateId;

                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleTemplateSelect(template.id)}
                        className={cn(
                          "rounded-[1.5rem] border p-5 text-left transition-all",
                          isSelected
                            ? "border-[#1f1c17] bg-[#1f1c17] text-white shadow-[0_18px_40px_rgba(31,24,18,0.18)]"
                            : "border-[#e6ded3] bg-white text-[#1f1c17] hover:border-[#cfc5b8] hover:bg-[#fcfaf6]"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold">{template.name}</p>
                          {isSelected ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-[#8b8378]" />}
                        </div>
                        <p className={cn("mt-3 text-[10px] font-semibold uppercase tracking-[0.18em]", isSelected ? "text-white/65" : "text-[#8b8378]")}>
                          {getTaskKindLabel(template.taskKind)}
                        </p>
                        <p className={cn("mt-2 text-sm leading-6", isSelected ? "text-white/82" : "text-[#6f675d]")}>{template.description}</p>
                        <p className={cn("mt-4 text-xs leading-5", isSelected ? "text-white/65" : "text-[#8b8378]")}>{template.outcome}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-5">
                    <Field label={`${getTaskKindLabel(selectedTemplate.taskKind)} title`} helper="Short board-facing summary for the first run.">
                      <Input
                        value={taskTitle}
                        onChange={(event) => {
                          setTaskTitle(event.target.value);
                          resetLaunchResult();
                        }}
                        placeholder="Improve the failed-state review path"
                      />
                    </Field>
                    <Field label={`${getTaskKindLabel(selectedTemplate.taskKind)} prompt`} helper="Describe the behavior, constraints, and what good verification should prove.">
                      <Textarea
                        value={taskPrompt}
                        onChange={(event) => {
                          setTaskPrompt(event.target.value);
                          resetLaunchResult();
                        }}
                        placeholder="Explain what the first run should improve and how trust should be earned."
                      />
                    </Field>
                  </div>

                  <InfoPanel
                    title="Starter template summary"
                    body={selectedTemplate.outcome}
                    items={[
                      `Project: ${projectName}`,
                      `Item type: ${getTaskKindLabel(selectedTemplate.taskKind)}`,
                      `Review owner: ${reviewOwner}`,
                      `Repo target: ${repoPath || "."}`,
                    ]}
                  />
                </div>
              </div>

              <StepActions>
                <Button variant="ghost" onClick={goBack} className="gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={goNext} disabled={!canAdvanceTask} className="gap-2">
                  Review launch plan
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </StepActions>
            </StepShell>
          ) : null}

          {step === 3 ? (
            <StepShell
              eyebrow="Step 4"
              title={createdTask ? "Starter run created" : "Launch the first repo-aware run"}
              description={
                createdTask
                  ? "The onboarding flow now hands off into the exact board and task-detail surfaces that make CodexFlow useful."
                  : "Review the exact project-backed payload that will be sent to the API, then create the starter run explicitly."
              }
            >
              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-4">
                  <ReadonlyStat
                    icon={<Workflow className="h-4 w-4" />}
                    label="Project"
                    value={projectName.trim()}
                    helper={`Reviewed by ${reviewOwner.trim()}`}
                  />
                  <ReadonlyStat
                    icon={<Sparkles className="h-4 w-4" />}
                    label="Item type"
                    value={getTaskKindLabel(selectedTemplate.taskKind)}
                    helper="Starter template controls whether the first run lands as an issue, task, or report."
                  />
                  <ReadonlyStat
                    icon={<FileSearch className="h-4 w-4" />}
                    label={`${getTaskKindLabel(selectedTemplate.taskKind)} title`}
                    value={taskTitle.trim()}
                    helper="This is the board-facing summary for the starter run."
                  />
                  <div className="rounded-[1.5rem] border border-[#e6ded3] bg-white p-5 shadow-sm">
                    <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#8b8378]">Prompt preview</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#40392f]">{taskPrompt.trim()}</p>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[#e6ded3] bg-[#faf6f0] p-5">
                  <p className="font-mono-ui text-[0.68rem] uppercase tracking-[0.24em] text-[#8b8378]">What happens next</p>
                  <div className="mt-5 space-y-3">
                    <ChecklistRow>The onboarding flow creates or reuses a real project through `/api/projects` before launching the first work item.</ChecklistRow>
                    <ChecklistRow>CodexFlow selects relevant files, builds a prompt preview, and records the exact work item type.</ChecklistRow>
                    <ChecklistRow>Patch preview, verification evidence, and score show up in the board/detail flow.</ChecklistRow>
                  </div>

                  <div className="mt-6 rounded-[1.25rem] border border-[#e3ddd2] bg-white px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#8b8378]">Verification defaults</p>
                    <div className="mt-3 space-y-2 text-sm text-[#4f473d]">
                      <p>Repo: {repoPath.trim() || "."}</p>
                      <p>Lint: {safeDefaults.lintCommand}</p>
                      <p>Tests: {safeDefaults.testCommand}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.25rem] border border-[#e3ddd2] bg-white px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#8b8378]">CLI checkpoints</p>
                    <div className="mt-3 space-y-2">
                      {[...installCommands.slice(0, 1), ...runtimeCommands.slice(0, 3)].map((item) => (
                        <CommandBlock key={item.command} label={item.label} command={item.command} compact />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {submitError ? (
                <div className="mt-6 rounded-[1.2rem] border border-[#efc4bc] bg-[#fff1ee] px-4 py-3 text-sm text-[#9f4e42]">
                  {submitError}
                </div>
              ) : null}

              {createdTask ? (
                <div className="mt-6 rounded-[1.6rem] border border-[#d9eee8] bg-[#f2fbf7] p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#dff5ed] text-[#176757]">
                      <Check className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#4b8a78]">Task created</p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#184b40]">{getTaskIdentifier(createdTask.id)}</h3>
                      <p className="mt-3 text-sm leading-7 text-[#326457]">
                        {createdTask.title} is now queued in the live pipeline as a {getTaskKindLabel(createdTask.taskKind).toLowerCase()} in{" "}
                        {createdProject?.name ?? "the selected project"}. Open the board for the system view or jump directly into task detail to inspect prompt preview, diff, and verification evidence.
                      </p>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <Button className="gap-2" onClick={() => router.push(`/tasks/${createdTask.id}`)}>
                          Open task detail
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Link href="/board">
                          <Button variant="outline">Open board</Button>
                        </Link>
                        <Link href="/projects">
                          <Button variant="outline">Open projects</Button>
                        </Link>
                      </div>
                      <div className="mt-5 rounded-[1.2rem] border border-[#d4ebe3] bg-white px-4 py-4 text-sm text-[#3f5f56]">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          <span>Status: {createdTask.status.replace("_", " ")}</span>
                        </div>
                        {createdProject ? <p className="mt-2">Project: {createdProject.name}</p> : null}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <StepActions>
                <Button variant="ghost" onClick={goBack} className="gap-2" disabled={isSubmitting}>
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                {createdTask ? null : (
                  <Button onClick={handleCreateStarterTask} disabled={!canAdvanceTask || isSubmitting} className="gap-2">
                    {isSubmitting ? `Creating starter ${getTaskKindLabel(selectedTemplate.taskKind).toLowerCase()}…` : `Create starter ${getTaskKindLabel(selectedTemplate.taskKind).toLowerCase()}`}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </StepActions>
            </StepShell>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function ProgressStepper({ activeStep, hasCompletion }: { activeStep: number; hasCompletion: boolean }) {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-[#ece4d8] pb-6">
      {steps.map((item, index) => {
        const isComplete = index < activeStep || (index === steps.length - 1 && hasCompletion);
        const isActive = index === activeStep;

        return (
          <div key={item.label} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isComplete
                    ? "bg-[#1f1c17] text-white"
                    : isActive
                      ? "border border-[#1f1c17] bg-white text-[#1f1c17]"
                      : "bg-[#f2ece4] text-[#8b8378]"
                )}
              >
                {isComplete ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </div>
              <span className={cn("text-sm", isActive || isComplete ? "text-[#1f1c17]" : "text-[#8b8378]")}>{item.label}</span>
            </div>
            {index < steps.length - 1 ? <div className="h-px w-8 bg-[#e4dbcf]" /> : null}
          </div>
        );
      })}
    </div>
  );
}

function StepShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <section>
      <p className="font-mono-ui text-[0.68rem] uppercase tracking-[0.24em] text-[#8b8378]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#1f1c17] sm:text-[2.3rem]">{title}</h2>
      <p className="mt-4 max-w-3xl text-base leading-8 text-[#6f675d]">{description}</p>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Field({ label, helper, children }: { label: string; helper: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <div>
        <p className="text-sm font-medium text-[#1f1c17]">{label}</p>
        <p className="mt-1 text-xs leading-5 text-[#8b8378]">{helper}</p>
      </div>
      {children}
    </label>
  );
}

function InfoPanel({ title, body, items }: { title: string; body: string; items: string[] }) {
  return (
    <div className="rounded-[1.5rem] border border-[#e6ded3] bg-[#faf6f0] p-5">
      <p className="text-lg font-semibold text-[#1f1c17]">{title}</p>
      <p className="mt-3 text-sm leading-7 text-[#6f675d]">{body}</p>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <ChecklistRow key={item}>{item}</ChecklistRow>
        ))}
      </div>
    </div>
  );
}

function ChecklistRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-[1rem] border border-[#e6ded3] bg-white px-4 py-3 text-sm text-[#4d463d]">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eff7f4] text-[#176757]">
        <Check className="h-3.5 w-3.5" />
      </div>
      <div className="leading-6">{children}</div>
    </div>
  );
}

function ReadonlyStat({ icon, label, value, helper }: { icon: ReactNode; label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[#e6ded3] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-[#746b60]">
        {icon}
        <p className="text-[0.68rem] uppercase tracking-[0.24em]">{label}</p>
      </div>
      <p className="mt-3 font-mono-ui text-sm text-[#1f1c17]">{value}</p>
      <p className="mt-3 text-sm leading-6 text-[#857c71]">{helper}</p>
    </div>
  );
}

function StepActions({ children }: { children: ReactNode }) {
  return <div className="mt-8 flex flex-wrap items-center justify-between gap-3">{children}</div>;
}

function CommandBlock({
  label,
  command,
  compact = false,
  subtle = false,
}: {
  label: string;
  command: string;
  compact?: boolean;
  subtle?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div
      className={cn(
        "rounded-[1.2rem] border px-4 py-3",
        subtle ? "border-[#eadfce] bg-[#fffdf9]" : "border-[#e6ded3] bg-white",
        compact ? "py-2.5" : "py-3"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f5efe7] text-[#6f675d]">
          <Terminal className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8b8378]">{label}</p>
          <code className="mt-2 block break-all font-mono-ui text-sm leading-6 text-[#1f1c17]">{command}</code>
        </div>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(command);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
          }}
          className="rounded-full border border-[#e6ded3] bg-white p-2 text-[#6f675d] transition-colors hover:border-[#cfc5b8] hover:text-[#1f1c17]"
          aria-label={`Copy command: ${command}`}
        >
          {copied ? <Check className="h-4 w-4 text-[#176757]" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
