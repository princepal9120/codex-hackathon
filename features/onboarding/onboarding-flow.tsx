'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ChevronLeft,
  Check,
  Rocket,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { fetchProjects, createProject } from '@/components/project-api';
import { createTask } from '@/components/task-api';

// Steps
import { StepProject } from './steps/StepProject';
import { StepCLI } from './steps/StepCLI';
import { StepTask } from './steps/StepTask';
import { StepLaunch } from './steps/StepLaunch';

const STEPS = [
  { label: 'Workspace', title: 'Anchor the project' },
  { label: 'Integrate CLI', title: 'Connect the runtime' },
  { label: 'First Task', title: 'Shape the request' },
  { label: 'Launch', title: 'Execute the run' },
];

interface OnboardingFlowProps {
  onComplete?: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // State
  const [projectName, setProjectName] = useState('My Codex Project');
  const [repoPath, setRepoPath] = useState('.');
  const [reviewOwner, setReviewOwner] = useState('Project Owner');
  const [selectedTemplateId, setSelectedTemplateId] = useState('bug-fix');
  const [taskTitle, setTaskTitle] = useState('Fix sticky header flash on scroll');
  const [taskPrompt, setTaskPrompt] = useState('Investigate why the header flashes when scrolling fast.');

  // Execution state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canContinue = useMemo(() => {
    if (step === 0) return projectName.trim() && repoPath.trim() && reviewOwner.trim();
    if (step === 2) return taskTitle.trim() && taskPrompt.trim();
    return true;
  }, [step, projectName, repoPath, reviewOwner, taskTitle, taskPrompt]);

  const handleNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleLaunch = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Create or get project
      const allProjects = await fetchProjects();
      let project = allProjects.find(p => p.name === projectName && p.repoPath === repoPath);

      if (!project) {
        project = await createProject({
          name: projectName,
          repoPath: repoPath,
          description: `Onboarding project for ${reviewOwner}`,
        });
      }

      // 2. Create task
      const task = await createTask({
        title: taskTitle,
        prompt: taskPrompt,
        projectId: project.id,
        taskKind: 'task',
        repoPath: repoPath,
        lintCommand: 'npm run lint',
        testCommand: 'npm test',
      });

      // 3. Complete and redirect
      if (onComplete) onComplete();
      router.push(`/board?from=onboarding&taskId=${task.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to launch project.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col lg:flex-row flex-1 gap-8 py-4">
        {/* Sidebar Progress (Simplified for Modal) */}
        <aside className="lg:w-48 flex-shrink-0">
          <nav className="space-y-4">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-[10px] font-bold transition-all",
                  i < step ? "bg-emerald-500 border-emerald-500 text-white" :
                    i === step ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" :
                      "bg-muted/50 border-border text-muted-foreground"
                )}>
                  {i < step ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                </div>
                <div className="hidden lg:block pt-0.5">
                  <p className={cn(
                    "text-xs font-bold transition-colors",
                    i <= step ? "text-foreground" : "text-muted-foreground"
                  )}>{s.label}</p>
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl bg-muted/30 border border-border p-4 space-y-3 hidden lg:block">
            <div className="flex items-center gap-2 text-primary">
              <Zap className="h-3 w-3 fill-primary/20" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Runtime</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Daemon</span>
              <span className="flex items-center gap-1 font-bold text-emerald-600">
                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-h-[400px]">
          {step === 0 && (
            <StepProject
              projectName={projectName} setProjectName={setProjectName}
              repoPath={repoPath} setRepoPath={setRepoPath}
              reviewOwner={reviewOwner} setReviewOwner={setReviewOwner}
            />
          )}
          {step === 1 && <StepCLI />}
          {step === 2 && (
            <StepTask
              selectedTemplateId={selectedTemplateId} setSelectedTemplateId={setSelectedTemplateId}
              taskTitle={taskTitle} setTaskTitle={setTaskTitle}
              taskPrompt={taskPrompt} setTaskPrompt={setTaskPrompt}
            />
          )}
          {step === 3 && (
            <StepLaunch
              projectName={projectName}
              repoPath={repoPath}
              reviewOwner={reviewOwner}
              taskTitle={taskTitle}
              taskPrompt={taskPrompt}
              isSubmitting={isSubmitting}
              submitError={submitError}
            />
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={step === 0 || isSubmitting}
          className="gap-2 h-10 px-4 font-bold"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-4">
          {step < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!canContinue}
              className="gap-2 h-10 px-6 font-extrabold shadow-lg shadow-primary/20"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleLaunch}
              disabled={isSubmitting}
              className="gap-2 h-10 px-8 font-extrabold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
            >
              {isSubmitting ? 'Launching...' : 'Launch Project'}
              <Rocket className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
