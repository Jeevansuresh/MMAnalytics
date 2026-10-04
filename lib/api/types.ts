// Mirrors docs/api-contract.yaml. Percentages are 0-100; monetary values are INR.
export type Role = "ceo" | "admin" | "campus_lead";
export type MockState = "success" | "loading" | "empty" | "error";
export interface StaffPreview {
  id: string;
  label: string;
  role: Role;
  campusId: string | null;
  enabled: boolean;
}
export interface Session {
  user: { id: string; name: string };
  role: Role;
  campusId: string | null;
  managedUsers: StaffPreview[];
}
export interface DateRange {
  from: string;
  to: string;
  campusId?: string;
}
export interface Period {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  days: number;
  availableDays: number;
  previousAvailableDays: number;
}
export interface Metric {
  id: string;
  label: string;
  value: number | null;
  previous: number | null;
  unit: "count" | "percent" | "minutes" | "currency" | "decimal";
  lowerIsBetter: boolean;
}
export interface SeriesPoint {
  date: string;
  signups: number;
  activated: number;
  dau: number;
  wau: number;
  fun: number;
  build: number;
  accepted: number;
}
export interface Insight {
  title: string;
  detail: string;
  kind: "positive" | "attention" | "neutral";
}
export interface Analytics {
  period: Period;
  kpis: Metric[];
  series: SeriesPoint[];
  insights: Insight[];
}
export interface Campus {
  id: string;
  name: string;
  shortName: string;
  city: string;
  students: number;
  registered: number;
  signups: number;
  penetration: number;
  sparksPerDay: number;
  answeredWithin15m: number;
  medianResponseMinutes: number;
  health: "healthy" | "watch" | "at_risk";
}
export interface CampusesResponse {
  period: Period;
  kpis: Metric[];
  campuses: Campus[];
  insights: Insight[];
}
export type SourceId = "ambassador" | "creator" | "referral" | "store";
export interface Source {
  id: SourceId;
  label: string;
  signups: number;
  activated: number;
  spend: number;
  costPerActivated: number | null;
}
export interface SourcesResponse {
  period: Period;
  kpis: Metric[];
  sources: Source[];
  series: SeriesPoint[];
  insights: Insight[];
}
export interface Ambassador {
  id: string;
  label: string;
  campusId: string;
  campusName: string;
  signups: number;
  activated: number;
  spend: number;
  costPerActivated: number | null;
}
export interface AmbassadorsResponse {
  period: Period;
  ambassadors: Ambassador[];
}
export interface SparkType {
  type: "Fun" | "Build";
  posts: number;
  accepted: number;
  acceptRate: number;
}
export interface SparksResponse extends Analytics {
  split: SparkType[];
}
export interface Cohort {
  week: string;
  size: number;
  d1: number | null;
  d7: number | null;
  d30: number | null;
  weeks: (number | null)[];
}
export interface RetentionResponse {
  period: Period;
  kpis: Metric[];
  cohorts: Cohort[];
  insights: Insight[];
}
export interface ApiError {
  code: string;
  message: string;
}
