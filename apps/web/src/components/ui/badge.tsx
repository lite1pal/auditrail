import { type HTMLAttributes } from "react";

import { cn } from "@/src/lib/ui/cn";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--panel-strong)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)]",
        className
      )}
      {...props}
    />
  );
}
