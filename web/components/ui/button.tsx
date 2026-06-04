import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-2xl text-sm font-semibold transition-all duration-200 active:bg-[#F6F0E7] active:text-[#5A4032] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#5A4032] text-white shadow-[0_12px_28px_rgba(90,64,50,0.16)] hover:bg-[#4C352A]",
        secondary: "bg-[#FDFBF7] text-[#5A4032] border border-[#E8D8C3] hover:bg-[#F6F0E7]",
        outline: "border border-[#E8D8C3] bg-white text-[#5A4032] hover:bg-[#FDFBF7]",
        ghost: "text-[#5A4032] hover:bg-[#FDFBF7]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3.5",
        lg: "h-12 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
));

Button.displayName = "Button";

export { Button, buttonVariants };
