'use client';

import Shell from "@/components/Shell";
import { Users, UserPlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AgentsPage() {
  return (
    <Shell>
      <header className="flex items-center justify-between gap-4 border-b border-border bg-background px-6 py-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">Agents</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage AI personas, capabilities, and tool access.</p>
        </div>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Deploy Agent
        </Button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-xl font-bold text-foreground">No active agents</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-6">
            Agents are persistent AI workers trained on your coding standards. Deploy agents to handle specific types of PR reviews or refactoring tasks.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              Browse Registry
            </Button>
            <Button variant="outline">Learn more</Button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
