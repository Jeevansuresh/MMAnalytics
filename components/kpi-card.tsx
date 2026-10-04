import type { Metric } from "@/lib/api/types";
import { formatValue, metricChange } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/icon";
export function KpiCard({
  metric,
  index = 0,
}: {
  metric: Metric;
  index?: number;
}) {
  const change = metricChange(metric);
  const positive =
    change !== null && (metric.lowerIsBetter ? change <= 0 : change >= 0);
  return (
    <Card className={`kpi-card ${index === 0 ? "kpi-featured" : ""}`}>
      <div className="kpi-label">
        {metric.label}
        <Icon name="arrow" size={14} />
      </div>
      <div className="kpi-value">{formatValue(metric.value, metric.unit)}</div>
      <div className="kpi-comparison">
        {change === null ? (
          <span>
            {metric.value === null
              ? "Awaiting mature data"
              : "No comparable prior period"}
          </span>
        ) : (
          <>
            <span className={positive ? "change-positive" : "change-negative"}>
              {change >= 0 ? "\u2197" : "\u2198"} {Math.abs(change).toFixed(1)}
              {metric.unit === "percent" ? " pp" : "%"}
            </span>
            <span>vs. previous period</span>
          </>
        )}
      </div>
    </Card>
  );
}
