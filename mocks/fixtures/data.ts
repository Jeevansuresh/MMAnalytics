import type { SourceId } from "@/lib/api/types";

export const DATA_START = "2026-07-07";
export const DATA_END = "2026-10-04";
export const DEFAULT_FROM = "2026-09-07";
export const DAY = 86_400_000;
export const dateAt = (date: string, offset: number) =>
  new Date(Date.parse(date) + offset * DAY).toISOString().slice(0, 10);
export const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b) - Date.parse(a)) / DAY);
export const campuses = [
  {
    id: "christ",
    name: "Christ University",
    shortName: "Christ",
    city: "Bengaluru",
    students: 12843,
    base: 1427,
    density: 1.18,
    retention: 1.05,
  },
  {
    id: "pes",
    name: "PES University",
    shortName: "PES",
    city: "Bengaluru",
    students: 9176,
    base: 894,
    density: 0.78,
    retention: 1.01,
  },
  {
    id: "rv",
    name: "RV University",
    shortName: "RV",
    city: "Bengaluru",
    students: 6342,
    base: 487,
    density: 0.41,
    retention: 0.95,
  },
  {
    id: "bms",
    name: "BMS College",
    shortName: "BMS",
    city: "Bengaluru",
    students: 7831,
    base: 612,
    density: 0.59,
    retention: 0.98,
  },
  {
    id: "jain",
    name: "Jain University",
    shortName: "Jain",
    city: "Bengaluru",
    students: 11067,
    base: 218,
    density: 0.24,
    retention: 0.49,
  },
];
export const ambassadors = [
  { id: "amb-01", label: "Ambassador 01", campusId: "christ", weight: 0.76 },
  { id: "amb-02", label: "Ambassador 02", campusId: "christ", weight: 0.24 },
  { id: "amb-03", label: "Ambassador 03", campusId: "pes", weight: 0.84 },
  { id: "amb-04", label: "Ambassador 04", campusId: "pes", weight: 0.16 },
  { id: "amb-05", label: "Ambassador 05", campusId: "rv", weight: 1 },
  { id: "amb-06", label: "Ambassador 06", campusId: "bms", weight: 0.69 },
  { id: "amb-07", label: "Ambassador 07", campusId: "bms", weight: 0.31 },
  { id: "amb-08", label: "Ambassador 08", campusId: "jain", weight: 1 },
];
export interface DailyRow {
  date: string;
  campusId: string;
  signups: number;
  activated: number;
  dau: number;
  wau: number;
  fun: number;
  build: number;
  funAccepted: number;
  buildAccepted: number;
  responses: number[];
  sources: Record<
    SourceId,
    { signups: number; activated: number; spend: number }
  >;
}
function random(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
export function allocate(total: number, weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0);
  const exact = weights.map((w) => (total * w) / sum);
  const result = exact.map(Math.floor);
  const order = exact
    .map((x, i) => ({ i, remainder: x - result[i] }))
    .sort((a, b) => b.remainder - a.remainder);
  const remaining = total - result.reduce((a, b) => a + b, 0);
  for (let i = 0; i < remaining; i++) result[order[i].i]++;
  return result;
}
export const daily: DailyRow[] = campuses.flatMap((campus, c) => {
  let registered = campus.base;
  return Array.from({ length: 90 }, (_, day) => {
    const date = dateAt(DATA_START, day);
    const weekend = [0, 6].includes(new Date(date).getUTCDay());
    const noise = 0.72 + random(day + c * 103) * 0.56;
    const trend = c === 4 ? 1 - day * 0.0031 : 1 + day * 0.0053;
    const signups = Math.max(
      1,
      Math.round(31 * campus.density * noise * trend * (weekend ? 0.73 : 1)),
    );
    registered += signups;
    const activated = Math.round(
      signups * (c === 4 ? 0.39 : 0.69 + random(day * 3 + c) * 0.13),
    );
    const dau = Math.round(
      registered *
        (c === 4 ? 0.072 : 0.2 + random(day + c * 7) * 0.055) *
        (weekend ? 0.79 : 1),
    );
    const wau = Math.round(
      registered * (c === 4 ? 0.18 : 0.47 + random(day + c * 13) * 0.035),
    );
    const posts = Math.max(
      1,
      Math.round(dau * (0.13 + random(day + 250 * c) * 0.06)),
    );
    const fun = Math.round(posts * (0.58 + random(day * 5 + c) * 0.16));
    const build = posts - fun;
    const funAccepted = Math.round(
      fun * (c === 4 ? 0.29 : 0.69 + random(day + 65) * 0.13),
    );
    const buildAccepted = Math.round(
      build * (c === 4 ? 0.21 : 0.52 + random(day + c + 83) * 0.18),
    );
    const responseShare = c === 4 ? 0.41 : 0.87;
    const responseCount = Math.round(posts * responseShare);
    const responses = Array.from({ length: responseCount }, (_, r) => {
      const draw = random(day * 71 + c * 713 + r * 23);
      return (
        Math.round(
          (c === 4
            ? 14 + Math.pow(draw, 1.3) * 64
            : 1.4 + Math.pow(draw, 2.4) * (c === 2 ? 39 : 27)) * 10,
        ) / 10
      );
    });
    const sourceCounts = allocate(signups, [
      0.39 + c * 0.025,
      0.24 - c * 0.018,
      0.23,
      0.14,
    ]);
    const sourceActivated = allocate(activated, sourceCounts);
    const sources = Object.fromEntries(
      (["ambassador", "creator", "referral", "store"] as SourceId[]).map(
        (id, i) => [
          id,
          {
            signups: sourceCounts[i],
            activated: sourceActivated[i],
            spend:
              Math.round(
                sourceCounts[i] *
                  [63.7, 92.3, 14.6, 0][i] *
                  (0.92 + random(day + c * 17) * 0.16) *
                  100,
              ) / 100,
          },
        ],
      ),
    ) as DailyRow["sources"];
    return {
      date,
      campusId: campus.id,
      signups,
      activated,
      dau,
      wau,
      fun,
      build,
      funAccepted,
      buildAccepted,
      responses,
      sources,
    };
  });
});
