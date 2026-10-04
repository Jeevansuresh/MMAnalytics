import { describe, expect, it } from "vitest";
import {
  ambassadors,
  campuses,
  daily,
  DATA_END,
  DATA_START,
  DEFAULT_FROM,
} from "./data";
import {
  ambassadorYield,
  campusList,
  median,
  overview,
  retention,
  sources,
  sparksSummary,
} from "./analytics";
const range = { from: DEFAULT_FROM, to: DATA_END };
describe("deterministic aggregate fixtures", () => {
  it("has five campuses, ninety days per campus, and eight anonymous ambassadors", () => {
    expect(campuses).toHaveLength(5);
    expect(ambassadors).toHaveLength(8);
    expect(daily).toHaveLength(450);
    for (const campus of campuses)
      expect(
        new Set(
          daily.filter((r) => r.campusId === campus.id).map((r) => r.date),
        ).size,
      ).toBe(90);
  });
  it("reconciles attribution and never creates activations or acceptances beyond volume", () => {
    for (const row of daily) {
      expect(
        Object.values(row.sources).reduce((a, s) => a + s.signups, 0),
      ).toBe(row.signups);
      expect(
        Object.values(row.sources).reduce((a, s) => a + s.activated, 0),
      ).toBe(row.activated);
      expect(row.activated).toBeLessThanOrEqual(row.signups);
      expect(row.funAccepted).toBeLessThanOrEqual(row.fun);
      expect(row.buildAccepted).toBeLessThanOrEqual(row.build);
      for (const source of Object.values(row.sources))
        expect(source.activated).toBeLessThanOrEqual(source.signups);
    }
  });
  it("has uneven density and a clearly underperforming campus", () => {
    const result = campusList(range);
    const weak = result.campuses.find((c) => c.id === "jain")!;
    const strong = result.campuses.find((c) => c.id === "christ")!;
    expect(weak.health).toBe("at_risk");
    const middle = result.campuses
      .filter((c) => c.id !== "jain")
      .map((c) => c.penetration);
    expect(Math.max(...middle) - Math.min(...middle)).toBeGreaterThan(10);
    expect(weak.penetration).toBeLessThan(strong.penetration / 3);
    expect(weak.answeredWithin15m).toBeLessThan(strong.answeredWithin15m / 2);
    expect(weak.medianResponseMinutes).toBeGreaterThan(
      strong.medianResponseMinutes * 3,
    );
  });
  it("reconciles ambassadors with ambassador-attributed acquisition", () => {
    const source = sources(range).sources.find((s) => s.id === "ambassador")!;
    const result = ambassadorYield(range).ambassadors;
    expect(result.reduce((a, b) => a + b.signups, 0)).toBe(source.signups);
    expect(result.reduce((a, b) => a + b.activated, 0)).toBe(source.activated);
    expect(result[0].signups).toBeGreaterThan(result.at(-1)!.signups * 3);
  });
  it("aggregates each selected period and compares equal prior windows", () => {
    const result = overview(range);
    expect(result.series).toHaveLength(28);
    expect(result.period.previousAvailableDays).toBe(28);
    expect(result.kpis[0].value).toBe(
      result.series.reduce((a, p) => a + p.signups, 0),
    );
    expect(result.kpis[0].previous).toBe(
      overview({
        from: result.period.previousFrom,
        to: result.period.previousTo,
      }).kpis[0].value,
    );
    const full = overview({ from: DATA_START, to: DATA_END });
    expect(full.kpis.every((k) => k.previous === null)).toBe(true);
  });
  it("keeps every endpoint scoped to one campus", () => {
    const scoped = { ...range, campusId: "christ" };
    expect(campusList(scoped).campuses.map((c) => c.id)).toEqual(["christ"]);
    expect(
      ambassadorYield(scoped).ambassadors.every((a) => a.campusId === "christ"),
    ).toBe(true);
    expect(overview(scoped).kpis[0].value).toBeLessThan(
      overview(range).kpis[0].value!,
    );
  });
  it("only fills mature cohort windows and reconciles cohort sizes", () => {
    const result = retention({ from: DATA_START, to: DATA_END });
    expect(result.cohorts.length).toBeGreaterThan(12);
    expect(result.cohorts.reduce((a, c) => a + c.size, 0)).toBe(
      result.kpis[0].value,
    );
    expect(result.cohorts[0].d30).not.toBeNull();
    expect(result.cohorts[0].weeks[1]).toBeGreaterThan(result.cohorts[0].d7!);
    expect(result.cohorts.at(-1)!.d1).toBeNull();
    expect(
      result.cohorts
        .at(-1)!
        .weeks.slice(1)
        .every((v) => v === null),
    ).toBe(true);
    for (const cohort of result.cohorts)
      for (const value of [...cohort.weeks, cohort.d1, cohort.d7, cohort.d30])
        if (value !== null) {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(100);
        }
  });
  it("returns coherent empty results for empty or out-of-window selections", () => {
    expect(overview(range, true).series).toEqual([]);
    expect(campusList(range, true).campuses).toEqual([]);
    expect(sources(range, true).sources).toEqual([]);
    expect(ambassadorYield(range, true).ambassadors).toEqual([]);
    expect(sparksSummary(range, true).split).toEqual([]);
    expect(retention(range, true).cohorts).toEqual([]);
    expect(
      overview({ from: "2025-01-01", to: "2025-01-28" }).kpis.every(
        (k) => k.value === null,
      ),
    ).toBe(true);
  });
  it("computes medians correctly for even and odd response samples", () => {
    expect(median([9, 1, 3, 7])).toBe(5);
    expect(median([9, 2, 3])).toBe(3);
  });
});
