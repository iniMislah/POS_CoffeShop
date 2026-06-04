import type { SelectHTMLAttributes } from "react";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

// Enhanced select with custom chevron and improved styling to avoid default browser UI
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn("relative inline-block w-full", className)}>
      <select
        className={cn(
          "h-11 w-full rounded-2xl border border-[#E8D8C3] bg-white px-4 pr-10 text-sm text-[#5A4032] outline-none transition focus:border-[#5A4032]/60 focus:ring-4 focus:ring-[#E8D8C3]/45 appearance-none",
          className,
        )}
        {...props}
      />
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <ChevronDown className="h-4 w-4 text-[#7B5F4D]" />
      </div>
    </div>
  );
}
