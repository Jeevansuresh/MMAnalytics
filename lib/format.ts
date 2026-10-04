import type { Metric } from "@/lib/api/types";
export function formatValue(
  value: number | null,
  unit: Metric["unit"] = "count",
) {
  if (value === null) return "\u2014";
  if (unit === "currency")
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  if (unit === "percent") return `${value.toFixed(1)}%`;
  if (unit === "minutes") return `${value.toFixed(1)} min`;
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: unit === "decimal" ? 1 : 0,
  }).format(value);
}
export function metricChange(metric: Metric) {
  if (
    metric.value === null ||
    metric.previous === null ||
    metric.previous === 0
  )
    return null;
  return metric.unit === "percent"
    ? metric.value - metric.previous
    : ((metric.value - metric.previous) / metric.previous) * 100;
}
export function shortDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
