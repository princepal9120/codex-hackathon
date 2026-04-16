'use client';

import Shell from "@/components/Shell";
import { Sparkles, Wand2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SkillsPage() {
  return (
    <Shell>
      <header className="flex items-center justify-between gap-4 border-b border-border bg-background px-6 py-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">Skills</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Extend your AI&apos;s capabilities with specialized toolsets.</p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Create Skill
        </Button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-xl font-bold text-foreground">Unlock new skills</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-6">
            Skills are custom tool definitions that allow CodexFlow to interact with external APIs, database schemas, and proprietary testing suites.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button className="gap-2">
              <Wand2 className="h-4 w-4" />
              Skill Marketplace
            </Button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
