'use client';

import Shell from "@/components/Shell";
import { Monitor, Cpu, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function RuntimesPage() {
  return (
    <Shell>
      <header className="flex items-center justify-between gap-4 border-b border-border bg-background px-6 py-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">Runtimes</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage execution environments and sandbox configurations.</p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Runtime
        </Button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sidebar-primary/10 text-sidebar-primary">
            <Monitor className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-xl font-bold text-foreground">Local runtime active</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-6">
            Task execution is currently using your local machine as the primary runtime. Add remote Docker runtimes or cloud sandboxes for more isolated execution.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button className="gap-2">
              <Cpu className="h-4 w-4" />
              Configure Sandbox
            </Button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
