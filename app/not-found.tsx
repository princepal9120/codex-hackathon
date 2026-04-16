import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="surface-panel max-w-2xl rounded-lg p-8 sm:p-10">
        <p className="text-[0.72rem] uppercase tracking-[0.3em] text-muted-foreground">Not found</p>
        <h1 className="font-display mt-4 text-4xl text-foreground sm:text-5xl">
          That route does not exist in this workspace.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          Use the landing page, onboarding flow, or board shell to continue.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/"><Button>Go home</Button></Link>
          <Link href="/board"><Button variant="outline">Open board</Button></Link>
        </div>
      </div>
    </main>
  );
}
