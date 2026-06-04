"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type ModernSelectOption = {
  value: string;
  label: string;
};

type ModernSelectProps = {
  value: string;
  placeholder?: string;
  options: ModernSelectOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
  className?: string;
};

export function ModernSelect({
  value,
  placeholder = "Select option",
  options,
  disabled = false,
  onChange,
  className,
}: ModernSelectProps) {
  return (
    <Select.Root value={value} onValueChange={onChange} disabled={disabled}>
      <Select.Trigger
        className={cn(
          "group flex h-12 w-full items-center justify-between rounded-[20px] border border-[#E8D8C3] bg-white px-4 text-left text-sm font-medium text-[#5A4032] shadow-[0_10px_24px_rgba(90,64,50,0.05)] outline-none transition-all duration-200 hover:bg-[#FDFBF7] focus:border-[#5A4032]/60 focus:ring-4 focus:ring-[#E8D8C3]/45 data-[state=open]:border-[#5A4032]/60 data-[state=open]:bg-white data-[state=open]:ring-4 data-[state=open]:ring-[#E8D8C3]/45 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      >
        <Select.Value placeholder={placeholder} className="truncate" />

        <Select.Icon asChild>
          <ChevronDown className="h-4 w-4 shrink-0 text-[#5A4032]/60 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          align="start"
          sideOffset={8}
          collisionPadding={20}
          className="z-[9999] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[22px] border border-[#E8D8C3] bg-white p-2 shadow-[0_24px_54px_rgba(90,64,50,0.12)]"
        >
          <Select.Viewport className="max-h-72 space-y-1 p-0.5">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="relative flex h-11 cursor-pointer select-none items-center rounded-[16px] px-4 pl-10 text-sm font-medium text-[#5A4032] outline-none transition-colors duration-150 data-[highlighted]:bg-[#5A4032] data-[highlighted]:text-white data-[state=checked]:bg-[#FDFBF7] data-[state=checked]:text-[#5A4032]"
              >
                <Select.ItemIndicator className="absolute left-3 flex h-5 w-5 items-center justify-center">
                  <Check className="h-4 w-4" />
                </Select.ItemIndicator>

                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
