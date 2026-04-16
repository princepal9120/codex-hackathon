import { type ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface HeaderMetaItem {
  label: string;
  value: ReactNode;
}

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  badge?: string;
  meta?: HeaderMetaItem[];
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({ eyebrow, title, description, badge, meta, actions, className }: PageHeaderProps) {
  return (
    <section className={cn("product-frame rounded-[34px] px-6 py-7 sm:px-8 sm:py-8", className)}>
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-3">
            {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8b8378]">{eyebrow}</p> : null}
            {badge ? <Badge variant="secondary">{badge}</Badge> : null}
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-[#1f1c17] sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#6f675d] sm:text-lg">{description}</p>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
      </div>

      {meta && meta.length > 0 ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {meta.map((item) => (
            <div key={item.label} className="surface-quiet rounded-[22px] px-4 py-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8d8478]">{item.label}</p>
              <div className="mt-2 text-sm font-medium text-[#2a261f]">{item.value}</div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
