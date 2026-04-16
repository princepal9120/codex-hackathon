import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--radius)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 focus:ring-offset-2 focus:ring-offset-background",
  {
    variants: {
      variant: {
        default: "border border-border bg-card text-foreground",
        primary: "border border-transparent bg-primary text-primary-foreground",
        secondary: "border border-transparent bg-secondary text-secondary-foreground",
        queued: "border border-transparent bg-muted text-muted-foreground",
        running: "border border-transparent bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
        passed: "border border-transparent bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
        failed: "border border-transparent bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
        warning: "border border-transparent bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
