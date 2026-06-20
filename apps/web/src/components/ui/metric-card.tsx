import { type ReactNode } from "react";

import { Card } from "@/src/components/ui/card";

interface MetricCardProps {
  children?: ReactNode;
  label: string;
  value?: string;
}

export function MetricCard({ children, label, value }: MetricCardProps) {
  return (
    <Card className="grid gap-4">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
        {label}
      </span>
      {value ? <strong className="text-4xl tracking-tight">{value}</strong> : children}
    </Card>
  );
}
