import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.16em] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:ring-offset-2 focus:ring-offset-[#f6f3ee]",
  {
    variants: {
      variant: {
        default: "border border-[#e4ddd2] bg-white text-[#3d372f]",
        primary: "border border-transparent bg-[#191713] text-[#fcfaf6]",
        secondary: "border border-transparent bg-[#f1ece4] text-[#544c41]",
        queued: "border border-transparent bg-[#f0ebe2] text-[#766d61]",
        running: "border border-transparent bg-[#fff0d8] text-[#a56b08]",
        passed: "border border-transparent bg-[#e4f4ec] text-[#277a46]",
        failed: "border border-transparent bg-[#f8e7e6] text-[#a64646]",
        warning: "border border-transparent bg-[#efe9fb] text-[#7a4fc8]",
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
