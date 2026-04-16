'use client';

import Shell from "@/components/Shell";
import { Shield, Bell, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <Shell>
      <header className="flex items-center justify-between gap-4 border-b border-border bg-background px-6 py-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">Settings</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Global workspace configurations and preferences.</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="mx-auto max-w-3xl space-y-8">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">General</h3>
            <div className="mt-4 space-y-4">
              <SettingsRow icon={<Database className="h-4 w-4" />} title="Task persistence" desc="Configure how long execution logs and diffs are stored." />
              <SettingsRow icon={<Bell className="h-4 w-4" />} title="Notifications" desc="Manage webhook alerts for passed and failed verifications." />
              <SettingsRow icon={<Shield className="h-4 w-4" />} title="Security" desc="Define access controls for repository scanning and local execution." />
            </div>
          </section>

          <section>
             <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Model Config</h3>
             <div className="mt-4 rounded-lg border border-border bg-card p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="font-semibold text-foreground">Default Engine</p>
                   <p className="text-sm text-muted-foreground mt-1">Select the primary model for coding task generation.</p>
                 </div>
                 <div className="rounded-md border border-border bg-muted px-4 py-2 text-sm font-medium">gpt-4o</div>
               </div>
             </div>
          </section>
        </div>
      </div>
    </Shell>
  );
}

function SettingsRow({ icon, title, desc }: { icon: React.ReactNode; title: string, desc: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/30">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground">{icon}</div>
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
      </div>
      <button className="text-xs font-semibold text-primary hover:underline">Edit</button>
    </div>
  );
}
