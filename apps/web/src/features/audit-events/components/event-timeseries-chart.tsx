"use client";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ChartPanel } from "@/src/components/ui/chart-panel";
import type { EventTimeseriesViewModel } from "@/src/features/audit-events/domain/types";

interface EventTimeseriesChartProps {
  points: EventTimeseriesViewModel["points"];
}
const bucketLabelFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short"
});
const tooltipLabelFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric"
});
export function EventTimeseriesChart({ points }: EventTimeseriesChartProps) {
  return (
    <ChartPanel
      eyebrow="Audit events"
      title="Event volume"
      description="Daily counts for the selected workspace and filters."
    >
      {points.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--panel-subtle)] text-sm text-[var(--muted)]">
          No event volume yet.
        </div>
      ) : (
        <div className="h-[220px] w-full">
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={points} margin={{ left: 0, right: 0, top: 8 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="bucketStart"
                axisLine={false}
                tickFormatter={formatBucketLabel}
                tickLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickFormatter={formatCountLabel}
                tickLine={false}
                tickMargin={8}
                width={28}
              />
              <Tooltip
                content={<EventTimeseriesTooltip />}
                cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }}
              />
              <Area
                dataKey="count"
                name="Events"
                fill="var(--foreground)"
                fillOpacity={0.08}
                stroke="var(--foreground)"
                strokeWidth={1.5}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartPanel>
  );
}
function formatBucketLabel(value: string) {
  return bucketLabelFormatter.format(new Date(value));
}
function formatCountLabel(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}
function formatTooltipLabel(value: string) {
  return tooltipLabelFormatter.format(new Date(value));
}
function EventTimeseriesTooltip({
  active,
  label,
  payload
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ value?: number }>;
}) {
  if (!active || !payload?.length || !label) {
    return null;
  }

  const count = payload[0]?.value ?? 0;

  return (
    <div className="grid gap-1 rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2 text-xs shadow-none">
      <span className="text-[var(--muted)]">{formatTooltipLabel(label)}</span>
      <strong className="text-[var(--foreground)]">
        {new Intl.NumberFormat("en").format(count)} events
      </strong>
    </div>
  );
}
