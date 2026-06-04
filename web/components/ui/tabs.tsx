"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return <TabsPrimitive.List className={cn("inline-flex rounded-2xl border border-[#E8D8C3] bg-[#FDFBF7] p-1", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "rounded-xl px-4 py-2 text-sm font-semibold text-[#5A4032]/70 transition data-[state=active]:bg-white data-[state=active]:text-[#5A4032] data-[state=active]:shadow-[0_10px_20px_rgba(90,64,50,0.08)]",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: TabsPrimitive.TabsContentProps) {
  return <TabsPrimitive.Content className={cn("mt-4", className)} {...props} />;
}
