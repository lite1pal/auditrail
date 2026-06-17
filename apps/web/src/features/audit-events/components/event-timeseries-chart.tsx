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

import type { EventTimeseriesViewModel } from "../domain/types";

interface EventTimeseriesChartProps {
  points: EventTimeseriesViewModel["points"];
}

export function EventTimeseriesChart({ points }: EventTimeseriesChartProps) {
  return (
    <article className="chart-panel">
      <span>Events over time</span>
      <ResponsiveContainer height={220} width="100%">
        <AreaChart data={points}>
          <CartesianGrid stroke="#edf0f5" />
          <XAxis dataKey="bucketStart" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
          <Tooltip />
          <Area dataKey="count" fill="#9cc2ff" stroke="#1f6feb" type="monotone" />
        </AreaChart>
      </ResponsiveContainer>
    </article>
  );
}
