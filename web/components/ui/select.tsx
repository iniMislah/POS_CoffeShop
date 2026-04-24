import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-2xl border border-coffee-300/30 bg-white px-4 text-sm text-coffee-900 outline-none transition focus:border-coffee-500 focus:ring-2 focus:ring-coffee-300/40",
        className,
      )}
      {...props}
    />
  );
}
