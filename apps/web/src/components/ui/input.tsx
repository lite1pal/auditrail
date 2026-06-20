import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/src/lib/ui/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        className={cn(
          "min-h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--foreground)_10%,white)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
