'use client';

import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: string;
  actions?: ReactNode;
  meta?: Array<{ label: string; value: ReactNode }>;
}

export default function PageHeader({ eyebrow, title, description, badge, actions, meta }: PageHeaderProps) {
  return (
    <header className="rounded-lg border border-border bg-card p-6 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>}
            {badge && <span className="rounded-[var(--radius)] border border-border bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">{badge}</span>}
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
          {description && <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>

      {meta && meta.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {meta.map(({ label, value }) => (
            <div key={label} className="rounded-[var(--radius)] border border-border bg-muted px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
              <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
