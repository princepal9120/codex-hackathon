'use client';

import type { ReactNode } from "react";

interface SurfaceCardProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  tone?: "default" | "soft" | "quiet";
}

export default function SurfaceCard({ eyebrow, title, description, children, tone = "default" }: SurfaceCardProps) {
  const toneStyles = {
    default: "border-border bg-card shadow-md",
    soft: "border-border bg-secondary/60",
    quiet: "border-border bg-muted",
  };

  return (
    <section className={`rounded-lg border p-6 ${toneStyles[tone]}`}>
      {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>}
      <h3 className="mt-2 text-lg font-bold text-foreground">{title}</h3>
      {description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>}
      {children && <div className="mt-5">{children}</div>}
    </section>
  );
}
