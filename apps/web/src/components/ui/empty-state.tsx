import { type HTMLAttributes } from "react";

import { cn } from "@/src/lib/ui/cn";

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
}

export function EmptyState({ className, label, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-[var(--border)] bg-[var(--panel)] p-8 text-center text-[var(--muted)] shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className
      )}
      {...props}
    >
      {label}
    </div>
  );
}
