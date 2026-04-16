'use client';

import { useState } from 'react';
import { Terminal, Copy, Check, Download, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const CLI_COMMANDS = [
    {
        label: 'Install CodexFlow CLI',
        description: 'Use our global installer to get the latest version of the CLI.',
        command: 'curl -fsSL https://codexflow.ai/install.sh | bash',
    },
    {
        label: 'Authenticate',
        description: 'Connect your local machine to your CodexFlow account.',
        command: 'codex auth login',
    },
    {
        label: 'Initialize Project',
        description: 'Run this in your repository root to configure CodexFlow.',
        command: 'codex init',
    },
    {
        label: 'Start Local Daemon',
        description: 'The daemon listens for CLI commands and syncs them with the board.',
        command: 'codex daemon start',
    },
];

export function StepCLI() {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
                <div className="space-y-4">
                    {CLI_COMMANDS.map((cmd, index) => (
                        <div key={index} className="group relative rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-widest text-primary/70">{index + 1}. {cmd.label}</p>
                                    <p className="text-sm text-muted-foreground">{cmd.description}</p>
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-lg"
                                    onClick={() => copyToClipboard(cmd.command, index)}
                                >
                                    {copiedIndex === index ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                            <div className="mt-4 flex items-center gap-3 rounded-xl bg-muted/50 p-3 font-mono text-sm border border-border/50">
                                <Terminal className="h-4 w-4 text-muted-foreground" />
                                <code className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-none">{cmd.command}</code>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                <div className="rounded-3xl border border-border bg-primary/5 p-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                        <Download className="h-6 w-6" />
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-foreground">CLI First Workflow</h3>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                        CodexFlow isn't just a dashboard. It's a high-performance engine that lives where you code.
                    </p>

                    <div className="mt-8 space-y-4">
                        <div className="flex items-center gap-4 py-2">
                            <Zap className="h-5 w-5 text-amber-500" />
                            <span className="text-sm font-medium text-foreground">Blazing fast repo scans</span>
                        </div>
                        <div className="flex items-center gap-4 py-2 border-t border-border/50">
                            <Shield className="h-5 w-5 text-emerald-500" />
                            <span className="text-sm font-medium text-foreground">Secure local execution</span>
                        </div>
                        <div className="flex items-center gap-4 py-2 border-t border-border/50">
                            <Terminal className="h-5 w-5 text-primary" />
                            <span className="text-sm font-medium text-foreground">Native IDE integration</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Pro Tip</p>
                    <p className="mt-2 text-sm text-amber-800 leading-relaxed">
                        Running `codex init` creates a `.codexflow` config in your repo. You can commit this to share verification rules with your team.
                    </p>
                </div>
            </div>
        </div>
    );
}
