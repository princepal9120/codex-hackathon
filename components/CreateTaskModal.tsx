'use client';

import { type ReactNode, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FolderTree, Search, ShieldCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { createTask } from "@/components/task-api";

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialForm = {
  title: "",
  prompt: "",
  repoPath: ".",
  lintCommand: "npm run lint",
  testCommand: "python3 -m unittest discover -s tests",
};

export default function CreateTaskModal({ open, onOpenChange }: CreateTaskModalProps) {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = useMemo(() => form.title.trim().length > 0 && form.prompt.trim().length > 0, [form.prompt, form.title]);

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const reset = () => {
    setForm(initialForm);
    setError(null);
    setIsSubmitting(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isSubmitting) {
      reset();
    }

    onOpenChange(nextOpen);
  };

  const handleCreate = async () => {
    if (!isValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const task = await createTask({
        title: form.title.trim(),
        prompt: form.prompt.trim(),
        repoPath: form.repoPath.trim() || ".",
        lintCommand: form.lintCommand.trim() || undefined,
        testCommand: form.testCommand.trim() || undefined,
      });

      reset();
      onOpenChange(false);
      router.push(`/tasks/${task.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create task.");
      setIsSubmitting(false);
    }
  };

  const promptWords = form.prompt.trim().split(/\s+/).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a repo-aware task</DialogTitle>
          <DialogDescription>
            Capture the request, set the repo scope, and send CodexFlow through prompt preview and verification.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto pr-1">
          <div className="grid gap-6 py-1 lg:grid-cols-[1.35fr_0.8fr]">
            <div className="space-y-5">
              <section className="surface-soft rounded-[26px] p-5">
                <div className="mb-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8c8377]">Core request</p>
                  <h3 className="mt-2 text-lg font-semibold text-[#1f1c17]">Describe the job clearly</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6f675d]">
                    Strong prompts make the file ranking, patch preview, and verification trail much more trustworthy.
                  </p>
                </div>

                <div className="grid gap-5">
                  <Field label="Title" helper="Short operator-facing summary used on the board and detail page.">
                    <Input
                      id="task-title"
                      type="text"
                      placeholder="Add a review-ready retry banner to failed runs"
                      value={form.title}
                      onChange={(event) => updateField("title", event.target.value)}
                    />
                  </Field>

                  <Field label="Prompt" helper="Describe the expected UI or behavior, constraints, and what good verification should prove.">
                    <Textarea
                      id="task-prompt"
                      placeholder="Example: Improve the failed-state experience on the task detail page. Keep the patch preview primary, add a clearer retry CTA, and preserve the existing API contract."
                      value={form.prompt}
                      onChange={(event) => updateField("prompt", event.target.value)}
                    />
                  </Field>
                </div>
              </section>

              <section className="surface-soft rounded-[26px] p-5">
                <div className="mb-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8c8377]">Execution settings</p>
                  <h3 className="mt-2 text-lg font-semibold text-[#1f1c17]">Control repo scope and verification</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6f675d]">
                    These values tell CodexFlow where to scan and which commands should prove the patch preview.
                  </p>
                </div>

                <div className="grid gap-5">
                  <Field label="Repository path" helper="Relative path used by the repo scanner and task runner.">
                    <Input
                      id="task-repo-path"
                      type="text"
                      placeholder="."
                      value={form.repoPath}
                      onChange={(event) => updateField("repoPath", event.target.value)}
                    />
                  </Field>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Lint command" helper="Optional command shown in verification evidence.">
                      <Input
                        id="task-lint-command"
                        type="text"
                        placeholder="npm run lint"
                        value={form.lintCommand}
                        onChange={(event) => updateField("lintCommand", event.target.value)}
                      />
                    </Field>
                    <Field label="Test command" helper="Optional command for execution-time verification.">
                      <Input
                        id="task-test-command"
                        type="text"
                        placeholder="npm test"
                        value={form.testCommand}
                        onChange={(event) => updateField("testCommand", event.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <section className="surface-panel rounded-[26px] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8c8377]">Run summary</p>
                <div className="mt-5 grid gap-3">
                  <SummaryStat label="Prompt words" value={String(promptWords)} />
                  <SummaryStat label="Repo target" value={form.repoPath.trim() || "."} mono />
                  <SummaryStat label="Verification" value={form.lintCommand.trim() && form.testCommand.trim() ? "Lint + tests" : "Partial"} />
                </div>
              </section>

              <section className="surface-soft rounded-[26px] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8c8377]">Pipeline</p>
                <div className="mt-5 space-y-3">
                  <PipelineRow icon={<FolderTree className="h-4 w-4 text-[#0f766e]" />} title="Rank relevant files" helper="Scan the repository and assemble the smallest useful context bundle." />
                  <PipelineRow icon={<Search className="h-4 w-4 text-[#0f766e]" />} title="Build prompt preview" helper="Capture the exact prompt and rationale before the run is trusted." />
                  <PipelineRow icon={<ShieldCheck className="h-4 w-4 text-[#0f766e]" />} title="Verify before trust" helper="Record lint, tests, logs, and a score for the review flow." />
                </div>
              </section>

              {error ? (
                <div className="rounded-[22px] border border-[#ebd2cf] bg-[#fbefee] px-4 py-3 text-sm text-[#9b4740]">{error}</div>
              ) : (
                <div className="rounded-[22px] border border-[#cfe7e4] bg-[#edf8f6] px-4 py-3 text-sm text-[#276c66]">
                  Every new task starts with a patch preview. Repository changes stay review artifacts first.
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!isValid || isSubmitting} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {isSubmitting ? "Creating…" : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, helper, children }: { label: string; helper: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <div>
        <p className="text-sm font-medium text-[#1f1c17]">{label}</p>
        <p className="mt-1 text-xs leading-5 text-[#7e7569]">{helper}</p>
      </div>
      {children}
    </label>
  );
}

function SummaryStat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="surface-quiet rounded-[20px] px-4 py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8c8377]">{label}</p>
      <p className={`mt-2 text-sm font-medium text-[#1f1c17] ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function PipelineRow({ icon, title, helper }: { icon: ReactNode; title: string; helper: string }) {
  return (
    <div className="rounded-[20px] border border-[#e8e0d4] bg-[rgba(255,255,255,0.82)] px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#edf8f6]">{icon}</div>
        <div>
          <p className="text-sm font-medium text-[#1f1c17]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[#7e7569]">{helper}</p>
        </div>
      </div>
    </div>
  );
}
