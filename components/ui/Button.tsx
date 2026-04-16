import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium tracking-[-0.02em] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f3ee] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#191713] text-[#fcfaf6] shadow-[0_10px_24px_rgba(25,23,19,0.16)] hover:-translate-y-0.5 hover:bg-[#26231d]",
        destructive: "bg-[#d56b5e] text-[#fffaf7] hover:-translate-y-0.5 hover:bg-[#c55f53]",
        outline: "border border-[#e1d9cd] bg-white text-[#1f1c17] hover:border-[#cbc1b3] hover:bg-[#fcfaf6]",
        secondary: "bg-[#f1ece4] text-[#2b261f] hover:bg-[#ebe4d9]",
        ghost: "text-[#5e564b] hover:bg-white/80 hover:text-[#1f1c17]",
        link: "text-[#0f766e] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-7 text-sm",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
));
Button.displayName = "Button";

export { Button, buttonVariants };
