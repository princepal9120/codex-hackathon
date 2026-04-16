'use client';

import Shell from "@/components/Shell";
import { Bot, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AutopilotPage() {
  return (
    <Shell>
      <header className="flex items-center justify-between gap-4 border-b border-border bg-background px-6 py-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">Autopilot</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Automated execution loops and background task runs.</p>
        </div>
        <Button size="sm" className="gap-2">
          <Zap className="h-4 w-4" />
          Create Loop
        </Button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
            <Bot className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-xl font-bold text-foreground">Autopilot is idling</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-6">
            Configure background execution loops that monitor your repository for specific conditions and trigger automated tasks.
          </p>
          <div className="mt-8">
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              Configure Autopilot
            </Button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
