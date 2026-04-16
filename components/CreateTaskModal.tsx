'use client';

import { type ReactNode, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileSearch, Search, ShieldCheck } from "lucide-react";

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
    if (!isValid || isSubmitting) return;

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
            Define the task, set the repo scope, and let CodexFlow handle context selection and verification.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto pr-1">
          <div className="grid gap-6 py-1 lg:grid-cols-[1.35fr_0.8fr]">
            <div className="space-y-5">
              <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <div className="mb-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-600">Core request</p>
                  <h3 className="mt-2 text-lg font-bold text-gray-900">Describe the job clearly</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
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

                  <Field label="Prompt" helper="Describe the expected behavior, constraints, and what good verification should prove.">
                    <Textarea
                      id="task-prompt"
                      placeholder="Example: Improve the failed-state experience on the task detail page. Keep the patch preview primary, add a clearer retry CTA, and preserve the existing API contract."
                      value={form.prompt}
                      onChange={(event) => updateField("prompt", event.target.value)}
                    />
                  </Field>
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <div className="mb-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-600">Execution settings</p>
                  <h3 className="mt-2 text-lg font-bold text-gray-900">Control repo scope and verification</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
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
                    <Field label="Lint command" helper="From codexflow.config.json.">
                      <Input
                        id="task-lint-command"
                        type="text"
                        placeholder="npm run lint"
                        value={form.lintCommand}
                        readOnly
                      />
                    </Field>
                    <Field label="Test command" helper="From codexflow.config.json.">
                      <Input
                        id="task-test-command"
                        type="text"
                        placeholder="npm test"
                        value={form.testCommand}
                        readOnly
                      />
                    </Field>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-600">Run summary</p>
                <div className="mt-4 grid gap-3">
                  <SummaryStat label="Prompt words" value={String(promptWords)} />
                  <SummaryStat label="Repo target" value={form.repoPath.trim() || "."} mono />
                  <SummaryStat label="Verification" value={form.lintCommand.trim() && form.testCommand.trim() ? "Lint + tests" : "Partial"} />
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-600">Pipeline</p>
                <div className="mt-4 space-y-2">
                  <PipelineRow icon={<FileSearch className="h-4 w-4 text-violet-600" />} title="Rank relevant files" helper="Scan the repository and assemble the context bundle." />
                  <PipelineRow icon={<Search className="h-4 w-4 text-violet-600" />} title="Build prompt preview" helper="Capture the exact prompt and rationale before the run." />
                  <PipelineRow icon={<ShieldCheck className="h-4 w-4 text-violet-600" />} title="Verify before trust" helper="Record lint, tests, logs, and a score for the review flow." />
                </div>
              </section>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              ) : (
                <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-700">
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
          <Button
            onClick={handleCreate}
            disabled={!isValid || isSubmitting}
            className="gap-2 bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-500/20"
          >
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
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-gray-500">{helper}</p>
      </div>
      {children}
    </label>
  );
}

function SummaryStat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <p className={`mt-1 text-sm font-medium text-gray-900 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function PipelineRow({ icon, title, helper }: { icon: ReactNode; title: string; helper: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50">{icon}</div>
        <div>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="mt-0.5 text-xs text-gray-500">{helper}</p>
        </div>
      </div>
    </div>
  );
}
