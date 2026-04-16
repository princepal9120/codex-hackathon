import { Badge } from "@/components/ui/Badge";
import SurfaceCard from "@/components/SurfaceCard";

interface DiffPanelProps {
  diff: string;
  patchSummary?: string;
}

export default function DiffPanel({ diff, patchSummary }: DiffPanelProps) {
  if (!diff) {
    return (
      <SurfaceCard eyebrow="Primary artifact" title="Patch preview" description="The diff will appear here as soon as CodexFlow captures a reviewable patch preview.">
        <div className="rounded-[22px] border border-dashed border-[#e6ded3] bg-[#faf6f0] px-5 py-12 text-center text-sm text-[#7b7267]">
          No diff has been captured yet.
        </div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard
      eyebrow="Primary artifact"
      title="Patch preview"
      description="This diff is the review artifact. CodexFlow does not auto-apply arbitrary repository changes."
      action={<Badge variant="warning">Preview first</Badge>}
      bodyClassName="p-0"
    >
      <div className="border-b border-[#efe4c9] bg-[#fff8e6] px-6 py-4 text-sm text-[#916a15] sm:px-7">
        <p className="font-medium text-[#5b4420]">Patch summary</p>
        <p className="mt-1 leading-6 text-[#8a6a26]">
          {patchSummary || "CodexFlow shows a patch preview for review before any human trusts the run."}
        </p>
      </div>
      <pre className="overflow-x-auto bg-[#fbfaf7] px-6 py-6 text-xs leading-7 text-[#4d463d] sm:px-7">
        <code>{diff}</code>
      </pre>
    </SurfaceCard>
  );
}
