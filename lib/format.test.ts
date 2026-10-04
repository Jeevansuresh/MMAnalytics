import { describe, expect, it } from "vitest";
import { formatValue, metricChange } from "./format";
import type { Metric } from "./api/types";
const metric: Metric = {
  id: "retention",
  label: "Retention",
  value: 43,
  previous: 40,
  unit: "percent",
  lowerIsBetter: false,
};
describe("metric presentation", () => {
  it("uses percentage points for rates and relative change for counts", () => {
    expect(metricChange(metric)).toBe(3);
    expect(metricChange({ ...metric, unit: "count" })).toBe(7.5);
  });
  it("does not invent a change when the baseline is missing or zero", () => {
    expect(metricChange({ ...metric, previous: null })).toBeNull();
    expect(metricChange({ ...metric, previous: 0 })).toBeNull();
  });
  it("formats missing values and fractional rates clearly", () => {
    expect(formatValue(null)).toBe("\u2014");
    expect(formatValue(37.25, "percent")).toBe("37.3%");
  });
});
