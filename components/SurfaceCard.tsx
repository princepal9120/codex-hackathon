'use client';

import type { ReactNode } from "react";

interface SurfaceCardProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  tone?: "default" | "soft" | "quiet";
}

export default function SurfaceCard({
  eyebrow,
  title,
  description,
  children,
  tone = "default",
}: SurfaceCardProps) {
  const toneStyles = {
    default: "border-gray-200 bg-white shadow-lg shadow-gray-900/5",
    soft: "border-gray-200 bg-gray-50/80",
    quiet: "border-gray-200 bg-gray-50",
  };

  return (
    <section className={`rounded-2xl border p-6 ${toneStyles[tone]}`}>
      {eyebrow && (
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-600">
          {eyebrow}
        </p>
      )}
      <h3 className="mt-2 text-lg font-bold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </section>
  );
}
