import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SurfaceCardProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  tone?: "panel" | "soft" | "quiet";
}

const toneClasses: Record<NonNullable<SurfaceCardProps["tone"]>, string> = {
  panel: "surface-panel",
  soft: "surface-soft",
  quiet: "surface-quiet",
};

export default function SurfaceCard({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  headerClassName,
  bodyClassName,
  tone = "panel",
}: SurfaceCardProps) {
  const hasHeader = eyebrow || title || description || action;

  return (
    <section className={cn("overflow-hidden rounded-[28px]", toneClasses[tone], className)}>
      {hasHeader ? (
        <div className={cn("border-b border-[#ece4d8] px-6 py-5 sm:px-7", headerClassName)}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              {eyebrow ? <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8c8377]">{eyebrow}</p> : null}
              {title ? <h2 className="text-lg font-semibold tracking-[-0.03em] text-[#201c17]">{title}</h2> : null}
              {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f675d]">{description}</p> : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
        </div>
      ) : null}
      <div className={cn("px-6 py-5 sm:px-7", bodyClassName)}>{children}</div>
    </section>
  );
}
