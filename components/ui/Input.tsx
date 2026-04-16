import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-11 w-full rounded-[18px] border border-[#ddd5ca] bg-white px-4 py-2 text-sm text-[#1f1c17] placeholder:text-[#958b7d] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] focus:border-[#8db9b3] focus:outline-none focus:ring-4 focus:ring-[#0f766e]/10 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
