import { type ReactNode } from "react";

import { Card } from "@/src/components/ui/card";

interface ChartPanelProps {
  children: ReactNode;
  description?: string;
  eyebrow: string;
  title: string;
}

export function ChartPanel({
  children,
  description,
  eyebrow,
  title
}: ChartPanelProps) {
  return (
    <Card className="grid gap-4 p-4 sm:p-5">
      <div className="grid gap-1">
        <p className="m-0 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
          {eyebrow}
        </p>
        <h2 className="text-base font-medium tracking-tight">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm text-[var(--muted)]">{description}</p>
        ) : null}
      </div>
      {children}
    </Card>
  );
}
