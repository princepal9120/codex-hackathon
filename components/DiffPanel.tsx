'use client';

interface DiffPanelProps {
  diff: string;
  patchSummary?: string;
}

export default function DiffPanel({ diff, patchSummary }: DiffPanelProps) {
  const content = diff?.trim() || patchSummary || "Patch preview will appear here once the task generates a diff artifact.";
  const lines = content.split("\n");

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-900/5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-600">
        Patch
      </p>
      <h3 className="mt-2 text-lg font-bold text-gray-900">Diff preview</h3>
      <p className="mt-1 text-sm text-gray-500">
        Review the generated patch before trusting the result.
      </p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-gray-950 p-4">
        <pre className="text-[12px] leading-6 font-mono">
          {lines.map((line, i) => {
            let className = "text-gray-400";
            if (line.startsWith("+++") || line.startsWith("---")) {
              className = "text-gray-500 font-semibold";
            } else if (line.startsWith("+")) {
              className = "text-green-400 bg-green-500/10 px-2 -mx-2 rounded";
            } else if (line.startsWith("-")) {
              className = "text-red-400 bg-red-500/10 px-2 -mx-2 rounded";
            } else if (line.startsWith("@@")) {
              className = "text-blue-400";
            } else if (line.startsWith("diff ")) {
              className = "text-violet-400 font-semibold";
            }

            return (
              <span key={i} className={`block ${className}`}>
                {line || " "}
              </span>
            );
          })}
        </pre>
      </div>
    </section>
  );
}
