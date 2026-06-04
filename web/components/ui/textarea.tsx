import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[100px] w-full rounded-2xl border border-[#E8D8C3] bg-white px-4 py-3 text-sm text-[#5A4032] outline-none transition placeholder:text-[#5A4032]/38 focus:border-[#5A4032]/60 focus:ring-4 focus:ring-[#E8D8C3]/45",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
