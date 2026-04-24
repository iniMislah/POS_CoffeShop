import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[100px] w-full rounded-2xl border border-coffee-300/30 bg-white px-4 py-3 text-sm text-coffee-900 outline-none transition focus:border-coffee-500 focus:ring-2 focus:ring-coffee-300/40",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
