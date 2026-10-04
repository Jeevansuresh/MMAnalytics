import type {
  Analytics,
  AmbassadorsResponse,
  Campus,
  CampusesResponse,
  Cohort,
  DateRange,
  Insight,
  Metric,
  Period,
  RetentionResponse,
  SeriesPoint,
  SourceId,
  SourcesResponse,
  SparksResponse,
} from "@/lib/api/types";
import {
  allocate,
  ambassadors,
  campuses,
  daily,
  DATA_END,
  dateAt,
  daysBetween,
  type DailyRow,
} from "./data";

const sum = (rows: DailyRow[], get: (row: DailyRow) => number) =>
  rows.reduce((a, row) => a + get(row), 0);
const round = (n: number) => Math.round(n * 10) / 10;
const pct = (a: number, b: number) => (b ? round((a / b) * 100) : 0);
const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
export function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length
    ? sorted.length % 2
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2
    : 0;
}
export function rowsFor(range: DateRange, empty = false) {
  return empty
    ? []
    : daily.filter(
        (d) =>
          d.date >= range.from &&
          d.date <= range.to &&
          (!range.campusId || d.campusId === range.campusId),
      );
}
export function periodFor(range: DateRange, empty = false): Period {
  const days = daysBetween(range.from, range.to) + 1;
  const previousFrom = dateAt(range.from, -days),
    previousTo = dateAt(range.from, -1);
  return {
    from: range.from,
    to: range.to,
    previousFrom,
    previousTo,
    days,
    availableDays: new Set(rowsFor(range, empty).map((r) => r.date)).size,
    previousAvailableDays: new Set(
      rowsFor({ ...range, from: previousFrom, to: previousTo }, empty).map(
        (r) => r.date,
      ),
    ).size,
  };
}
function context(range: DateRange, empty: boolean) {
  const period = periodFor(range, empty);
  const rows = rowsFor(range, empty);
  const previous = rowsFor(
    { ...range, from: period.previousFrom, to: period.previousTo },
    empty,
  );
  const metric = (
    id: string,
    label: string,
    unit: Metric["unit"],
    compute: (r: DailyRow[], end: string) => number | null,
    lowerIsBetter = false,
  ): Metric => ({
    id,
    label,
    unit,
    value: rows.length ? compute(rows, range.to) : null,
    previous:
      period.previousAvailableDays === period.days
        ? compute(previous, period.previousTo)
        : null,
    lowerIsBetter,
  });
  return { period, rows, previous, metric };
}
export function seriesFor(rows: DailyRow[]): SeriesPoint[] {
  return [...new Set(rows.map((r) => r.date))].sort().map((date) => {
    const group = rows.filter((r) => r.date === date);
    return {
      date,
      signups: sum(group, (r) => r.signups),
      activated: sum(group, (r) => r.activated),
      dau: sum(group, (r) => r.dau),
      wau: sum(group, (r) => r.wau),
      fun: sum(group, (r) => r.fun),
      build: sum(group, (r) => r.build),
      accepted: sum(group, (r) => r.funAccepted + r.buildAccepted),
    };
  });
}
function retentionValue(row: DailyRow, day: number, weekly = false) {
  const campus = campuses.find((c) => c.id === row.campusId)!;
  const base = weekly
    ? 48.6 * Math.exp(-day / 70)
    : day === 1
      ? 47.9
      : day === 7
        ? 32.7
        : day === 30
          ? 21.4
          : 36.8 * Math.exp(-day / 68);
  return Math.min(
    100,
    base * campus.retention +
      Math.sin(daysBetween("2026-07-07", row.date) * 0.15) * 2.1,
  );
}
function retentionRate(
  rows: DailyRow[],
  end: string,
  day: number,
  weekly = false,
) {
  const eligible = rows.filter(
    (r) => dateAt(r.date, day) <= end && dateAt(r.date, day) <= DATA_END,
  );
  const count = sum(eligible, (r) => r.signups);
  return count
    ? round(
        sum(eligible, (r) => r.signups * retentionValue(r, day, weekly)) /
          count,
      )
    : null;
}
const retentionKpis = (metric: ReturnType<typeof context>["metric"]) => [
  metric("d1", "D1 retention", "percent", (r, end) => retentionRate(r, end, 1)),
  metric("d7", "D7 retention", "percent", (r, end) => retentionRate(r, end, 7)),
  metric("d30", "D30 retention", "percent", (r, end) =>
    retentionRate(r, end, 30),
  ),
];
export function overview(range: DateRange, empty = false): Analytics {
  const { period, rows, metric } = context(range, empty);
  const insights: Insight[] = rows.length
    ? [
        {
          title: "The first week matters",
          detail:
            "Compare D1 and D7 return rates to see where new students lose momentum. Only mature signup cohorts are included.",
          kind: "neutral",
        },
      ]
    : [];
  return {
    period,
    kpis: [
      metric("signups", "New signups", "count", (r) =>
        sum(r, (d) => d.signups),
      ),
      metric("activated", "Activated users", "count", (r) =>
        sum(r, (d) => d.activated),
      ),
      metric("dau", "Avg. daily active", "count", (r) =>
        mean(seriesFor(r).map((d) => d.dau)),
      ),
      metric("wau", "Avg. weekly active", "count", (r) =>
        mean(seriesFor(r).map((d) => d.wau)),
      ),
      ...retentionKpis(metric),
    ],
    series: seriesFor(rows),
    insights,
  };
}
const sparks = (r: DailyRow[]) => sum(r, (d) => d.fun + d.build);
const responseRate = (r: DailyRow[]) =>
  pct(
    sum(r, (d) => d.responses.filter((t) => t <= 15).length),
    sparks(r),
  );
const responseMedian = (r: DailyRow[]) =>
  round(median(r.flatMap((d) => d.responses)));
function campusAt(id: string, rows: DailyRow[], end: string): Campus {
  const c = campuses.find((c) => c.id === id)!;
  const registered =
    c.base +
    sum(
      daily.filter((d) => d.campusId === id && d.date <= end),
      (d) => d.signups,
    );
  const answeredWithin15m = responseRate(rows);
  return {
    id,
    name: c.name,
    shortName: c.shortName,
    city: c.city,
    students: c.students,
    registered,
    signups: sum(rows, (d) => d.signups),
    penetration: pct(registered, c.students),
    sparksPerDay: round(
      sparks(rows) / Math.max(1, new Set(rows.map((r) => r.date)).size),
    ),
    answeredWithin15m,
    medianResponseMinutes: responseMedian(rows),
    health:
      answeredWithin15m < 40
        ? "at_risk"
        : answeredWithin15m < 60
          ? "watch"
          : "healthy",
  };
}
function penetration(rows: DailyRow[], end: string) {
  const selected = campuses.filter((c) =>
    rows.some((d) => d.campusId === c.id),
  );
  return pct(
    selected.reduce(
      (a, c) =>
        a +
        campusAt(
          c.id,
          rows.filter((r) => r.campusId === c.id),
          end,
        ).registered,
      0,
    ),
    selected.reduce((a, c) => a + c.students, 0),
  );
}
export function campusMetrics(range: DateRange, empty = false): Analytics {
  const { period, rows, metric } = context(range, empty);
  return {
    period,
    kpis: [
      metric("penetration", "Campus penetration", "percent", penetration),
      metric(
        "sparks",
        "Sparks per day",
        "decimal",
        (r) => sparks(r) / new Set(r.map((d) => d.date)).size,
      ),
      metric("fast", "Answered in 15 min", "percent", responseRate),
      metric(
        "response",
        "Median first response",
        "minutes",
        responseMedian,
        true,
      ),
    ],
    series: seriesFor(rows),
    insights: [],
  };
}
export function campusList(range: DateRange, empty = false): CampusesResponse {
  const rows = rowsFor(range, empty);
  const list = campuses
    .filter((c) => rows.some((r) => r.campusId === c.id))
    .map((c) =>
      campusAt(
        c.id,
        rows.filter((r) => r.campusId === c.id),
        range.to,
      ),
    );
  const atRisk = list.find((c) => c.health === "at_risk");
  const { period, kpis } = campusMetrics(range, empty);
  return {
    period,
    kpis,
    campuses: list,
    insights: atRisk
      ? [
          {
            title: `${atRisk.shortName} needs a closer look`,
            detail: `${atRisk.penetration}% penetration and ${atRisk.answeredWithin15m}% answered within 15 minutes. Focus ambassador activity on making the first Spark work.`,
            kind: "attention",
          },
        ]
      : [],
  };
}
export function sources(range: DateRange, empty = false): SourcesResponse {
  const { period, rows, metric } = context(range, empty);
  const spend = (r: DailyRow[]) =>
    sum(r, (d) => Object.values(d.sources).reduce((a, s) => a + s.spend, 0));
  const list = rows.length
    ? (["ambassador", "creator", "referral", "store"] as SourceId[]).map(
        (id) => {
          const signups = sum(rows, (r) => r.sources[id].signups),
            activated = sum(rows, (r) => r.sources[id].activated),
            cost = sum(rows, (r) => r.sources[id].spend);
          return {
            id,
            label: id[0].toUpperCase() + id.slice(1),
            signups,
            activated,
            spend: round(cost),
            costPerActivated: activated ? round(cost / activated) : null,
          };
        },
      )
    : [];
  return {
    period,
    kpis: [
      metric("signups", "Attributed signups", "count", (r) =>
        sum(r, (d) => d.signups),
      ),
      metric("activated", "Activated users", "count", (r) =>
        sum(r, (d) => d.activated),
      ),
      metric("spend", "Acquisition spend", "currency", spend, true),
      metric(
        "cpa",
        "Cost / activated user",
        "currency",
        (r) =>
          spend(r) /
          Math.max(
            1,
            sum(r, (d) => d.activated),
          ),
        true,
      ),
    ],
    sources: list,
    series: seriesFor(rows),
    insights: rows.length
      ? [
          {
            title: "Yield over reach",
            detail:
              "Compare activated users per rupee before scaling a source. Store signups are organic and carry no attributed spend.",
            kind: "neutral",
          },
        ]
      : [],
  };
}
export function ambassadorYield(
  range: DateRange,
  empty = false,
): AmbassadorsResponse {
  const rows = rowsFor(range, empty);
  const list = ambassadors
    .filter((a) => rows.some((r) => r.campusId === a.campusId))
    .map((a) => {
      const peers = ambassadors.filter((p) => p.campusId === a.campusId),
        idx = peers.findIndex((p) => p.id === a.id);
      const campusRows = rows.filter((r) => r.campusId === a.campusId);
      const signups = sum(
        campusRows,
        (r) =>
          allocate(
            r.sources.ambassador.signups,
            peers.map((p) => p.weight),
          )[idx],
      );
      const activated = sum(
        campusRows,
        (r) =>
          allocate(
            r.sources.ambassador.activated,
            peers.map((p) => p.weight),
          )[idx],
      );
      const spend = round(
        sum(campusRows, (r) => r.sources.ambassador.spend) * a.weight,
      );
      return {
        id: a.id,
        label: a.label,
        campusId: a.campusId,
        campusName: campuses.find((c) => c.id === a.campusId)!.shortName,
        signups,
        activated,
        spend,
        costPerActivated: activated ? round(spend / activated) : null,
      };
    })
    .sort((a, b) => b.activated - a.activated);
  return { period: periodFor(range, empty), ambassadors: list };
}
export function sparksSummary(range: DateRange, empty = false): SparksResponse {
  const { period, rows, metric } = context(range, empty);
  const split = rows.length
    ? (["Fun", "Build"] as const).map((type) => {
        const posts = sum(rows, (r) => (type === "Fun" ? r.fun : r.build)),
          accepted = sum(rows, (r) =>
            type === "Fun" ? r.funAccepted : r.buildAccepted,
          );
        return { type, posts, accepted, acceptRate: pct(accepted, posts) };
      })
    : [];
  return {
    period,
    kpis: [
      metric("posts", "Sparks posted", "count", sparks),
      metric("fun", "Fun Sparks", "count", (r) => sum(r, (d) => d.fun)),
      metric("build", "Build Sparks", "count", (r) => sum(r, (d) => d.build)),
      metric("accept", "Post-to-accept rate", "percent", (r) =>
        pct(
          sum(r, (d) => d.funAccepted + d.buildAccepted),
          sparks(r),
        ),
      ),
    ],
    series: seriesFor(rows),
    split,
    insights: rows.length
      ? [
          {
            title: "Two reasons to connect",
            detail:
              "Fun tracks social connections; Build tracks projects and collaboration. Acceptance means at least one student accepted a Spark.",
            kind: "neutral",
          },
        ]
      : [],
  };
}
export function retention(range: DateRange, empty = false): RetentionResponse {
  const { period, rows, metric } = context(range, empty);
  const monday = (date: string) =>
    dateAt(date, -(new Date(date).getUTCDay() + 6) % 7);
  const cohorts: Cohort[] = [...new Set(rows.map((r) => monday(r.date)))]
    .sort()
    .map((week) => {
      const group = rows.filter((r) => monday(r.date) === week);
      const lastDate = group.reduce((a, r) => (r.date > a ? r.date : a), week);
      const rate = (day: number) =>
        dateAt(lastDate, day) <= range.to && dateAt(lastDate, day) <= DATA_END
          ? retentionRate(group, range.to, day)
          : null;
      return {
        week,
        size: sum(group, (r) => r.signups),
        d1: rate(1),
        d7: rate(7),
        d30: rate(30),
        weeks: Array.from({ length: 9 }, (_, w) =>
          w === 0
            ? 100
            : dateAt(lastDate, w * 7 + 6) <= range.to &&
                dateAt(lastDate, w * 7 + 6) <= DATA_END
              ? retentionRate(group, range.to, w * 7, true)
              : null,
        ),
      };
    });
  return {
    period,
    kpis: [
      metric("cohort-users", "Users in cohorts", "count", (r) =>
        sum(r, (d) => d.signups),
      ),
      ...retentionKpis(metric),
    ],
    cohorts,
    insights: rows.length
      ? [
          {
            title: "Read across, then down",
            detail:
              "Across shows how one cohort returns over time. Down compares cohorts at the same age. A dash means that observation window has not matured.",
            kind: "neutral",
          },
        ]
      : [],
  };
}
