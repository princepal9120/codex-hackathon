import { Suspense } from "react";

import Shell from "@/components/Shell";
import ProjectsPageClient from "@/features/projects/projects-page-client";

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsPageFallback />}>
      <ProjectsPageClient />
    </Suspense>
  );
}

function ProjectsPageFallback() {
  return (
    <Shell>
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <div className="rounded-[24px] border border-border bg-background px-6 py-4 text-sm text-muted-foreground shadow-sm">
          Loading projects…
        </div>
      </div>
    </Shell>
  );
}
