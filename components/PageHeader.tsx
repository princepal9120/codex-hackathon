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

export default function PageHeader({
  eyebrow,
  title,
  description,
  badge,
  actions,
  meta,
}: PageHeaderProps) {
  return (
    <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-900/5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            {eyebrow && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-600">
                {eyebrow}
              </p>
            )}
            {badge && (
              <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[10px] font-semibold text-violet-600">
                {badge}
              </span>
            )}
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 text-sm leading-7 text-gray-600">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>

      {meta && meta.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {meta.map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                {label}
              </p>
              <div className="mt-1 text-sm font-semibold text-gray-900">{value}</div>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
