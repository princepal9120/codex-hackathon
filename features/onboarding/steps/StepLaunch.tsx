'use client';

import { Rocket, Box, Check, Loader2, AlertCircle } from 'lucide-react';

interface StepLaunchProps {
    projectName: string;
    repoPath: string;
    reviewOwner: string;
    taskTitle: string;
    taskPrompt: string;
    isSubmitting: boolean;
    submitError: string | null;
}

export function StepLaunch({
    projectName,
    repoPath,
    reviewOwner,
    taskTitle,
    taskPrompt,
    isSubmitting,
    submitError,
}: StepLaunchProps) {
    return (
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-foreground">Launch Configuration</h3>
                <p className="text-sm text-muted-foreground">Review your settings before creating the starter task and opening the board.</p>

                <div className="space-y-4">
                    <ConfigItem label="Project Name" value={projectName} icon={<Box className="h-4 w-4" />} />
                    <ConfigItem label="Repository Path" value={repoPath} icon={<Rocket className="h-4 w-4" />} />
                    <ConfigItem label="Review Owner" value={reviewOwner} icon={<Check className="h-4 w-4" />} />
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary/70">Task: {taskTitle}</p>
                    <div className="mt-4 rounded-xl bg-muted/30 p-4">
                        <p className="text-sm italic text-muted-foreground leading-relaxed line-clamp-4">
                            "{taskPrompt}"
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-muted/10 p-10 text-center">
                {isSubmitting ? (
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Loader2 className="h-10 w-10 animate-spin" />
                            </div>
                        </div>
                        <h4 className="mt-8 text-xl font-bold text-foreground">Writing to disk...</h4>
                        <p className="mt-2 text-sm text-muted-foreground">Initializing your project and queuing the first task.</p>
                    </div>
                ) : submitError ? (
                    <div className="flex flex-col items-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                            <AlertCircle className="h-8 w-8" />
                        </div>
                        <h4 className="mt-6 text-lg font-bold text-red-500 underline decoration-red-500/30">Handoff Failed</h4>
                        <div className="mt-4 rounded-xl bg-red-500/5 p-4 border border-red-500/10">
                            <p className="text-sm text-red-700">{submitError}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                            <Rocket className="h-10 w-10" />
                        </div>
                        <h4 className="mt-8 text-2xl font-bold text-foreground">Ready to Launch</h4>
                        <p className="mt-2 text-sm text-muted-foreground">Everything looks perfect. Clicking 'Launch' will take you straight to the Kanban board.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function ConfigItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 px-4 py-3">
            <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    {icon}
                </div>
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </div>
            <span className="text-sm font-bold text-foreground">{value}</span>
        </div>
    );
}
