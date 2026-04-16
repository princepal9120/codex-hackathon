'use client';

import { Sparkles, Check, Info } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';
import { type TaskKind } from '@/components/task-api';

interface Template {
    id: string;
    name: string;
    description: string;
    title: string;
    prompt: string;
    taskKind: TaskKind;
}

const STARTER_TEMPLATES: Template[] = [
    {
        id: "bug-fix",
        name: "Bug Fix",
        description: "Fix a specific bug in a component or logic.",
        title: "Fix sticky header flash on scroll",
        prompt: "Investigate why the header flashes when scrolling fast. Ensure the layout remains stable and verify with visual regression if possible.",
        taskKind: "issue",
    },
    {
        id: "feature-polish",
        name: "Feature Polish",
        description: "Improve UI/UX of an existing feature.",
        title: "Enhance button hover micro-animations",
        prompt: "Add subtle scale and shadow transitions to all primary buttons. Maintain the premium glassmorphism aesthetic.",
        taskKind: "task",
    },
    {
        id: "custom",
        name: "Custom Run",
        description: "Launch a custom task with your own prompt.",
        title: "",
        prompt: "",
        taskKind: "task",
    },
];

interface StepTaskProps {
    selectedTemplateId: string;
    setSelectedTemplateId: (id: string) => void;
    taskTitle: string;
    setTaskTitle: (val: string) => void;
    taskPrompt: string;
    setTaskPrompt: (val: string) => void;
}

export function StepTask({
    selectedTemplateId,
    setSelectedTemplateId,
    taskTitle,
    setTaskTitle,
    taskPrompt,
    setTaskPrompt,
}: StepTaskProps) {
    const handleSelect = (template: Template) => {
        setSelectedTemplateId(template.id);
        if (template.id !== 'custom') {
            setTaskTitle(template.title);
            setTaskPrompt(template.prompt);
        }
    };

    return (
        <div className="space-y-10">
            <div className="grid gap-4 sm:grid-cols-3">
                {STARTER_TEMPLATES.map((template) => {
                    const isSelected = selectedTemplateId === template.id;
                    return (
                        <button
                            key={template.id}
                            onClick={() => handleSelect(template)}
                            className={cn(
                                "group relative flex flex-col items-start rounded-2xl border p-6 text-left transition-all duration-300",
                                isSelected
                                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xl shadow-primary/5"
                                    : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                            )}
                        >
                            <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                                isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                            )}>
                                {isSelected ? <Check className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                            </div>
                            <p className="mt-4 font-bold text-foreground">{template.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{template.description}</p>
                        </button>
                    );
                })}
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-6">
                    <div className="grid gap-2">
                        <label className="text-sm font-semibold text-foreground">Task title</label>
                        <Input
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            placeholder="e.g. Implement user profile page"
                            className="h-12 border-border/50 bg-background/50 focus:bg-background"
                        />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-semibold text-foreground">Task prompt</label>
                        <Textarea
                            value={taskPrompt}
                            onChange={(e) => setTaskPrompt(e.target.value)}
                            placeholder="Describe what needs to be done. The more context, the better."
                            className="min-h-[160px] border-border/50 bg-background/50 focus:bg-background resize-none py-3"
                        />
                    </div>
                </div>

                <div className="rounded-3xl border border-border bg-muted/20 p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3 text-primary">
                        <Info className="h-5 w-5" />
                        <h3 className="font-bold">Prompting Best Practices</h3>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                        Codex performs best when prompts are specific and outcome-oriented.
                    </p>
                    <ul className="mt-6 space-y-3">
                        {[
                            "Mention specific files or modules if known.",
                            "Define success criteria (e.g. 'Build must pass').",
                            "Describe the desired UX in detail.",
                            "List any constraints or forbidden patterns.",
                        ].map((tip, i) => (
                            <li key={i} className="flex items-start gap-3 text-xs text-muted-foreground italic">
                                <span className="text-primary font-bold">→</span>
                                {tip}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
