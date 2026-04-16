import { spawn } from "node:child_process";

import { loadCodexFlowConfig, resolveTaskCommands, resolveTaskRepoPath } from "@/lib/config";
import { getTaskById, updateTask } from "@/lib/server/task-store";
import type { RunTaskResult } from "@/lib/task-types";

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

  updateTask(taskId, {
    status: "running",
    runStartedAt,
    runFinishedAt: null,
    logs: `Loading repository context from ${repoPath}...`,
    errorMessage: null,
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

    return updateTask(taskId, {
      status: result.status,
      score: result.score,
      selectedFiles: result.selectedFiles,
      codexOutput: result.codexOutput,
      diffOutput: result.diffOutput,
      lintStatus: result.lintStatus,
      testStatus: result.testStatus,
      logs: result.logs,
      errorMessage: result.errorMessage ?? null,
      runFinishedAt: new Date().toISOString(),
    });
  } catch (error) {
    return updateTask(taskId, {
      status: "failed",
      lintStatus: "failed",
      testStatus: "failed",
      logs: `Execution failed.\n\n${String(error)}`,
      errorMessage: String(error),
      runFinishedAt: new Date().toISOString(),
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
