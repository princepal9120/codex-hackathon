import fs from "node:fs";
import path from "node:path";

import type { CreateTaskInput, TaskRecord } from "@/lib/task-types";

export interface CodexFlowConfig {
  repoPath: string;
  lintCommand: string;
  testCommand: string;
  maxFiles: number;
}

const DEFAULT_CONFIG: CodexFlowConfig = {
  repoPath: ".",
  lintCommand: "npm run lint",
  testCommand: "python3 -m unittest discover -s tests",
  maxFiles: 8,
};

export function getConfigPath() {
  return path.join(process.cwd(), "codexflow.config.json");
}

export function loadCodexFlowConfig(): CodexFlowConfig {
  const filePath = getConfigPath();

  if (!fs.existsSync(filePath)) {
    return DEFAULT_CONFIG;
  }

  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as Partial<CodexFlowConfig>;

  return {
    repoPath: parsed.repoPath ?? DEFAULT_CONFIG.repoPath,
    lintCommand: parsed.lintCommand ?? DEFAULT_CONFIG.lintCommand,
    testCommand: parsed.testCommand ?? DEFAULT_CONFIG.testCommand,
    maxFiles: parsed.maxFiles ?? DEFAULT_CONFIG.maxFiles,
  };
}

function isPathWithin(basePath: string, candidatePath: string) {
  const relative = path.relative(basePath, candidatePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function getConfiguredRepoRoot(config: CodexFlowConfig) {
  return path.isAbsolute(config.repoPath)
    ? path.resolve(config.repoPath)
    : path.resolve(process.cwd(), config.repoPath);
}

export function resolveRepoPathWithinConfig(repoPath: string | undefined, config: CodexFlowConfig) {
  const baseRoot = getConfiguredRepoRoot(config);
  const rawPath = repoPath?.trim();

  if (!rawPath || rawPath === "." || rawPath === config.repoPath) {
    return baseRoot;
  }

  const candidate = path.isAbsolute(rawPath)
    ? path.resolve(rawPath)
    : path.resolve(baseRoot, rawPath);

  return isPathWithin(baseRoot, candidate) ? candidate : null;
}

export function getStoredTaskRepoPath(repoPath: string | undefined, config: CodexFlowConfig) {
  const rawPath = repoPath?.trim();

  if (!rawPath || rawPath === ".") {
    return config.repoPath;
  }

  return rawPath;
}

export function isAllowedVerificationCommand(command: string | undefined, allowedCommand: string) {
  const normalized = command?.trim();
  return !normalized || normalized === allowedCommand;
}

export function resolveTaskRepoPath(task: Pick<TaskRecord, "repoPath">, config: CodexFlowConfig) {
  return resolveRepoPathWithinConfig(task.repoPath, config) ?? getConfiguredRepoRoot(config);
}

export function resolveTaskCommands(task: Pick<TaskRecord, "lintCommand" | "testCommand">, config: CodexFlowConfig) {
  return {
    lintCommand: isAllowedVerificationCommand(task.lintCommand ?? undefined, config.lintCommand)
      ? task.lintCommand || config.lintCommand
      : config.lintCommand,
    testCommand: isAllowedVerificationCommand(task.testCommand ?? undefined, config.testCommand)
      ? task.testCommand || config.testCommand
      : config.testCommand,
  };
}

export function validateCreateTaskInput(input: CreateTaskInput, config: CodexFlowConfig) {
  const errors: string[] = [];

  if (!resolveRepoPathWithinConfig(input.repoPath, config)) {
    errors.push("Repository path must stay inside the configured repository root.");
  }

  if (!isAllowedVerificationCommand(input.lintCommand, config.lintCommand)) {
    errors.push("Lint command must match the configured safe command.");
  }

  if (!isAllowedVerificationCommand(input.testCommand, config.testCommand)) {
    errors.push("Test command must match the configured safe command.");
  }

  return {
    errors,
    input: {
      ...input,
      repoPath: getStoredTaskRepoPath(input.repoPath, config),
      lintCommand: config.lintCommand,
      testCommand: config.testCommand,
    },
  };
}
