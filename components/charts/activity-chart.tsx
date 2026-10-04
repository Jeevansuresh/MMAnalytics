"use client";
import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SeriesPoint } from "@/lib/api/types";
import { shortDate } from "@/lib/format";
const axis = { fontSize: 11, fill: "var(--muted-foreground)" };
const tooltip = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--foreground)",
  fontSize: 12,
};
export function ActivityChart({
  data,
  mode = "acquisition",
}: {
  data: SeriesPoint[];
  mode?: "acquisition" | "engagement" | "sparks";
}) {
  const id = useId().replace(/:/g, "");
  const primary =
    mode === "acquisition" ? "signups" : mode === "engagement" ? "wau" : "fun";
  const secondary =
    mode === "acquisition"
      ? "activated"
      : mode === "engagement"
        ? "dau"
        : "build";
  const labels = {
    signups: "Signups",
    activated: "Activated",
    dau: "DAU",
    wau: "WAU",
    fun: "Fun",
    build: "Build",
  };
  return (
    <div
      className="chart-wrap"
      role="img"
      aria-label={`${labels[primary]} and ${labels[secondary]} over the selected period`}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart
          data={data}
          margin={{ top: 12, right: 8, left: -22, bottom: 0 }}
        >
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 5"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={axis}
            tickLine={false}
            axisLine={false}
            minTickGap={45}
            dy={8}
          />
          <YAxis
            tick={axis}
            tickLine={false}
            axisLine={false}
            tickFormatter={(n: number) =>
              n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
            }
          />
          <Tooltip
            contentStyle={tooltip}
            labelFormatter={(value) => shortDate(String(value))}
          />
          <Area
            type="monotone"
            dataKey={primary}
            name={labels[primary]}
            stroke="var(--primary)"
            fill={`url(#${id})`}
            strokeWidth={2.3}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey={secondary}
            name={labels[secondary]}
            stroke="var(--chart-secondary)"
            fill="transparent"
            strokeWidth={1.8}
            strokeDasharray="4 4"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function ComparisonChart({
  data,
  label = "Signups",
}: {
  data: { name: string; value: number }[];
  label?: string;
}) {
  return (
    <div className="chart-wrap" role="img" aria-label={`${label} comparison`}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 24, left: 5, bottom: 0 }}
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 5"
            horizontal={false}
          />
          <XAxis type="number" tick={axis} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={axis}
            width={85}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltip} cursor={{ fill: "var(--muted)" }} />
          <Bar
            dataKey="value"
            name={label}
            fill="var(--primary)"
            radius={[0, 4, 4, 0]}
            barSize={18}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
