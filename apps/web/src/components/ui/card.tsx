import { type HTMLAttributes } from "react";

import { cn } from "@/src/lib/ui/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur",
        className
      )}
      {...props}
    />
  );
}
