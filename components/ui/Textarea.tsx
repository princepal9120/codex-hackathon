import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[160px] w-full rounded-[18px] border border-[#ddd5ca] bg-white px-4 py-3 text-sm leading-6 text-[#1f1c17] placeholder:text-[#958b7d] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] focus:border-[#8db9b3] focus:outline-none focus:ring-4 focus:ring-[#0f766e]/10 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
