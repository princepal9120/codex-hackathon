'use client';

import { TerminalSquare, ShieldCheck, FolderGit2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface StepProjectProps {
    projectName: string;
    setProjectName: (val: string) => void;
    repoPath: string;
    setRepoPath: (val: string) => void;
    reviewOwner: string;
    setReviewOwner: (val: string) => void;
}

export function StepProject({
    projectName,
    setProjectName,
    repoPath,
    setRepoPath,
    reviewOwner,
    setReviewOwner,
}: StepProjectProps) {
    return (
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
                <div className="grid gap-2">
                    <label className="text-sm font-semibold text-foreground">Project name</label>
                    <p className="text-xs text-muted-foreground">This anchors your workspace. Use a name that team members will recognize.</p>
                    <Input
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="e.g. Runtime Reliability"
                        className="h-12 border-border/50 bg-background/50 focus:bg-background"
                    />
                </div>

                <div className="grid gap-2">
                    <label className="text-sm font-semibold text-foreground">Repository path</label>
                    <p className="text-xs text-muted-foreground">The local directory where your project lives. Use `.` for the current directory.</p>
                    <Input
                        value={repoPath}
                        onChange={(e) => setRepoPath(e.target.value)}
                        placeholder="."
                        className="h-12 border-border/50 bg-background/50 focus:bg-background"
                    />
                </div>

                <div className="grid gap-2">
                    <label className="text-sm font-semibold text-foreground">Review owner</label>
                    <p className="text-xs text-muted-foreground">The primary person responsible for reviewing AI-suggested changes.</p>
                    <Input
                        value={reviewOwner}
                        onChange={(e) => setReviewOwner(e.target.value)}
                        placeholder="e.g. Lead Engineer"
                        className="h-12 border-border/50 bg-background/50 focus:bg-background"
                    />
                </div>
            </div>

            <div className="rounded-3xl border border-border bg-muted/30 p-8">
                <h3 className="text-lg font-bold text-foreground">Why this matters</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    CodexFlow works by anchoring itself to a specific repository context.
                    By defining these parameters, you enable:
                </p>

                <div className="mt-8 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <FolderGit2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">Repo-Aware Analysis</p>
                            <p className="mt-1 text-xs text-muted-foreground">AI understands your full codebase structure.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">Safe Sandboxing</p>
                            <p className="mt-1 text-xs text-muted-foreground">All executions remain isolated within your local environment.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <TerminalSquare className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">CLI Handoff</p>
                            <p className="mt-1 text-xs text-muted-foreground">The board syncs with your terminal sessions automatically.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
