'use client';

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="surface-panel max-w-2xl rounded-lg p-8 sm:p-10">
        <p className="text-[0.72rem] uppercase tracking-[0.3em] text-muted-foreground">App error</p>
        <h1 className="font-display mt-4 text-4xl text-foreground sm:text-5xl">
          Something interrupted the workspace.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          The development server hit an unexpected error while rendering this route.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={reset} className="gap-2"><RefreshCcw className="h-4 w-4" />Try again</Button>
          <Link href="/board"><Button variant="outline">Go to board</Button></Link>
        </div>
      </div>
    </main>
  );
}
