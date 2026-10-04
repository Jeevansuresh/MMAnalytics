"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type RequestOptions } from "@/lib/api/client";
import type {
  Analytics,
  AmbassadorsResponse,
  CampusesResponse,
  DateRange,
  Insight,
  Metric,
  Period,
  RetentionResponse,
  SourcesResponse,
  SparksResponse,
} from "@/lib/api/types";
import { presetRange } from "@/lib/date-ranges";
import { formatValue, shortDate } from "@/lib/format";
import { useApp } from "./app-provider";
import { type Screen, screenName } from "./dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Icon } from "./icon";
import { KpiCard } from "./kpi-card";
import { ActivityChart, ComparisonChart } from "./charts/activity-chart";

interface PageData {
  period: Period;
  kpis: Metric[];
  insights: Insight[];
  catalog: CampusesResponse;
  campuses?: CampusesResponse;
  overview?: Analytics;
  campusMetrics?: Analytics;
  sources?: SourcesResponse;
  ambassadors?: AmbassadorsResponse;
  sparks?: SparksResponse;
  retention?: RetentionResponse;
  empty: boolean;
}
async function loadPage(
  screen: Screen,
  range: DateRange,
  options: RequestOptions,
): Promise<PageData> {
  const catalogRequest = api.campuses(
    { from: range.from, to: range.to },
    { ...options, state: "success" },
  );
  if (screen === "overview") {
    const [main, campuses, catalog] = await Promise.all([
      api.overview(range, options),
      api.campuses(range, options),
      catalogRequest,
    ]);
    return {
      ...main,
      overview: main,
      campuses,
      catalog,
      empty: !main.series.length,
    };
  }
  if (screen === "campuses") {
    const [main, catalog, detail] = await Promise.all([
      api.campuses(range, options),
      catalogRequest,
      range.campusId
        ? api.campusMetrics(range.campusId, range, options)
        : Promise.resolve(undefined),
    ]);
    return {
      ...main,
      campuses: main,
      campusMetrics: detail,
      catalog,
      empty: !main.campuses.length,
    };
  }
  if (screen === "growth") {
    const [main, ambassadors, catalog] = await Promise.all([
      api.sources(range, options),
      api.ambassadors(range, options),
      catalogRequest,
    ]);
    return {
      ...main,
      sources: main,
      ambassadors,
      catalog,
      empty: !main.sources.length,
    };
  }
  if (screen === "sparks") {
    const [main, catalog] = await Promise.all([
      api.sparks(range, options),
      catalogRequest,
    ]);
    return { ...main, sparks: main, catalog, empty: !main.series.length };
  }
  const [main, catalog] = await Promise.all([
    api.retention(range, options),
    catalogRequest,
  ]);
  return { ...main, retention: main, catalog, empty: !main.cohorts.length };
}
const subtitles: Record<Screen, string> = {
  overview: "From first signup to everyday habit. Your community, at a glance.",
  campuses:
    "See where connections are taking hold — and where they need a nudge.",
  growth: "Follow the channels and people bringing your next active users.",
  sparks: "Small interactions. Real connections. Track what turns into a yes.",
  retention: "Acquisition starts the story. Coming back is what makes it last.",
};
function Legend({ labels }: { labels: string[] }) {
  return (
    <div className="chart-legend">
      {labels.map((label, i) => (
        <span key={label}>
          <i className={i ? "secondary" : ""} />
          {label}
        </span>
      ))}
    </div>
  );
}
function Panel({
  title,
  description,
  children,
  action,
  className = "",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
function CampusTable({
  data,
  compact = false,
  onSelect,
}: {
  data: CampusesResponse;
  compact?: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Campus</th>
            <th>Penetration</th>
            {!compact && <th>Sparks / day</th>}
            <th>Answered &lt;15m</th>
            {!compact && <th>First response</th>}
            <th>Health</th>
          </tr>
        </thead>
        <tbody>
          {data.campuses.map((campus) => (
            <tr key={campus.id}>
              <td>
                <button
                  className="campus-name"
                  onClick={() => onSelect(campus.id)}
                >
                  <span className="campus-avatar">
                    {campus.shortName.slice(0, 2).toUpperCase()}
                  </span>
                  <span>
                    {campus.name}
                    {!compact && (
                      <small>
                        {campus.city} · {formatValue(campus.students)} students
                      </small>
                    )}
                  </span>
                </button>
              </td>
              <td>
                <div className="inline-progress">
                  <span>{campus.penetration.toFixed(1)}%</span>
                  <div>
                    <i style={{ width: `${campus.penetration}%` }} />
                  </div>
                </div>
              </td>
              {!compact && (
                <td>{formatValue(campus.sparksPerDay, "decimal")}</td>
              )}
              <td>{campus.answeredWithin15m.toFixed(1)}%</td>
              {!compact && (
                <td>{campus.medianResponseMinutes.toFixed(1)} min</td>
              )}
              <td>
                <Badge className={`health health-${campus.health}`}>
                  <span />
                  {campus.health === "at_risk"
                    ? "Needs attention"
                    : campus.health === "watch"
                      ? "Developing"
                      : "Healthy"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function OverviewContent({
  data,
  onSelect,
}: {
  data: PageData;
  onSelect: (id: string) => void;
}) {
  const [mode, setMode] = useState<"acquisition" | "engagement">("acquisition");
  return (
    <>
      <div className="content-grid">
        <Panel
          title="Community growth"
          description="A daily view of your acquisition and engagement."
          action={
            <div className="segmented-control">
              <button
                aria-pressed={mode === "acquisition"}
                onClick={() => setMode("acquisition")}
              >
                Acquisition
              </button>
              <button
                aria-pressed={mode === "engagement"}
                onClick={() => setMode("engagement")}
              >
                Engagement
              </button>
            </div>
          }
        >
          <Legend
            labels={
              mode === "acquisition" ? ["Signups", "Activated"] : ["WAU", "DAU"]
            }
          />
          <ActivityChart data={data.overview!.series} mode={mode} />
        </Panel>
        <Panel
          title="Are they coming back?"
          description="Retention after a student's first signup."
          action={
            <Icon
              name="retention"
              size={17}
              className="text-muted-foreground"
            />
          }
        >
          <div className="retention-snapshot">
            {data.kpis.slice(4).map((metric) => (
              <div key={metric.id}>
                <div>
                  <span>{metric.label}</span>
                  <strong>{formatValue(metric.value, "percent")}</strong>
                </div>
                <div className="retention-track">
                  <i style={{ width: `${metric.value ?? 0}%` }} />
                </div>
                <small>
                  {metric.value === null
                    ? "No mature cohorts in this window"
                    : "of eligible new users returned"}
                </small>
              </div>
            ))}
          </div>
          <Link href="/retention" className="text-link">
            Explore weekly cohorts <Icon name="arrow" size={13} />
          </Link>
        </Panel>
      </div>
      <Panel
        title="Campus pulse"
        description="Density creates momentum. Keep an eye on the first response."
        action={
          <Link href="/campuses" className="text-link">
            All campuses <Icon name="arrow" size={13} />
          </Link>
        }
      >
        <CampusTable data={data.campuses!} compact onSelect={onSelect} />
      </Panel>
    </>
  );
}
function CampusesContent({
  data,
  onSelect,
}: {
  data: PageData;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <div className="content-grid">
        <Panel
          title={
            data.campusMetrics
              ? "Campus Spark activity"
              : "Density across campuses"
          }
          description={
            data.campusMetrics
              ? "Fun and Build volume in the selected campus."
              : "Registered students as a share of total campus population."
          }
        >
          {data.campusMetrics ? (
            <>
              <Legend labels={["Fun", "Build"]} />
              <ActivityChart data={data.campusMetrics.series} mode="sparks" />
            </>
          ) : (
            <ComparisonChart
              data={data.campuses!.campuses.map((c) => ({
                name: c.shortName,
                value: c.penetration,
              }))}
              label="Penetration (%)"
            />
          )}
        </Panel>
        <Panel
          title="Response health"
          description="First connections set the tone."
        >
          <div className="response-list">
            {data.campuses!.campuses.map((c) => (
              <div key={c.id}>
                <div>
                  <span>{c.shortName}</span>
                  <strong>
                    {c.answeredWithin15m.toFixed(1)}
                    <small>%</small>
                  </strong>
                </div>
                <div className="retention-track">
                  <i
                    style={{
                      width: `${c.answeredWithin15m}%`,
                      opacity: c.health === "at_risk" ? 0.35 : 1,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="panel-footnote">
            Share of all Sparks with a first response within 15 minutes.
          </p>
        </Panel>
      </div>
      <Panel
        title="Campus performance"
        description="Select a campus to inspect its daily activity."
        action={<Badge>{data.campuses!.campuses.length} campuses</Badge>}
      >
        <CampusTable data={data.campuses!} onSelect={onSelect} />
      </Panel>
    </>
  );
}
function GrowthContent({ data }: { data: PageData }) {
  return (
    <>
      <div className="content-grid">
        <Panel
          title="Where new users find us"
          description="Exclusive attribution across four signup sources."
        >
          <ComparisonChart
            data={data.sources!.sources.map((s) => ({
              name: s.label,
              value: s.signups,
            }))}
          />
        </Panel>
        <Panel
          title="Source efficiency"
          description="Spend is attributed in Indian rupees."
        >
          <div className="source-list">
            {data.sources!.sources.map((s) => (
              <div key={s.id}>
                <div>
                  <strong>{s.label}</strong>
                  <small>{formatValue(s.activated)} activated users</small>
                </div>
                <div>
                  <strong>{formatValue(s.costPerActivated, "currency")}</strong>
                  <small>per activated user</small>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel
        title="Ambassador impact"
        description="Anonymous program IDs. Ranked by activated users, not reach."
        action={
          <Badge>{data.ambassadors!.ambassadors.length} ambassadors</Badge>
        }
      >
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ambassador</th>
                <th>Campus</th>
                <th>Signups</th>
                <th>Activated</th>
                <th>Activation rate</th>
                <th>Cost / activated</th>
              </tr>
            </thead>
            <tbody>
              {data.ambassadors!.ambassadors.map((a, i) => (
                <tr key={a.id}>
                  <td>
                    <span className="rank">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <strong>{a.label}</strong>
                  </td>
                  <td>{a.campusName}</td>
                  <td>{formatValue(a.signups)}</td>
                  <td className="accent-text">{formatValue(a.activated)}</td>
                  <td>
                    {a.signups
                      ? ((a.activated / a.signups) * 100).toFixed(1)
                      : "0.0"}
                    %
                  </td>
                  <td>{formatValue(a.costPerActivated, "currency")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
function SparksContent({ data }: { data: PageData }) {
  const total = data.sparks!.split.reduce((a, s) => a + s.posts, 0);
  const funShare = total ? (data.sparks!.split[0].posts / total) * 100 : 0;
  return (
    <>
      <div className="content-grid">
        <Panel
          title="Sparks in motion"
          description="Daily posts across social connections and collaboration."
        >
          <Legend labels={["Fun", "Build"]} />
          <ActivityChart data={data.sparks!.series} mode="sparks" />
        </Panel>
        <Panel
          title="A little fun. A little ambition."
          description="The mix of reasons students connect."
        >
          <div
            className="donut-chart"
            role="img"
            aria-label={`Fun ${funShare.toFixed(1)}%, Build ${(100 - funShare).toFixed(1)}%`}
            style={{
              background: `conic-gradient(var(--primary) 0% ${funShare}%, var(--chart-secondary) ${funShare}% 100%)`,
            }}
          >
            <div>
              <small>TOTAL SPARKS</small>
              <strong>{formatValue(total)}</strong>
            </div>
          </div>
          <div className="split-legend">
            {data.sparks!.split.map((s, i) => (
              <div key={s.type}>
                <span className={i ? "split-dot secondary" : "split-dot"} />
                {s.type}
                <strong>{((s.posts / total) * 100).toFixed(1)}%</strong>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel
        title="From posted to accepted"
        description="A Spark counts once when at least one student accepts it."
      >
        <div className="spark-funnels">
          {data.sparks!.split.map((s) => (
            <div key={s.type}>
              <div className="funnel-header">
                <span className="funnel-title">
                  <Icon name="sparks" size={17} />
                  {s.type} Sparks
                </span>
                <Badge>{s.acceptRate.toFixed(1)}% accepted</Badge>
              </div>
              <div className="funnel-values">
                <div>
                  <small>POSTED</small>
                  <strong>{formatValue(s.posts)}</strong>
                </div>
                <span>→</span>
                <div>
                  <small>ACCEPTED</small>
                  <strong className="accent-text">
                    {formatValue(s.accepted)}
                  </strong>
                </div>
              </div>
              <div className="retention-track">
                <i style={{ width: `${s.acceptRate}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
function heatColor(value: number | null) {
  return value === null
    ? {}
    : {
        backgroundColor: `color-mix(in srgb, var(--primary) ${value > 65 ? 100 : Math.max(7, value * 0.7)}%, var(--card))`,
        color: value > 65 ? "var(--primary-foreground)" : "var(--foreground)",
      };
}
function RetentionContent({ data }: { data: PageData }) {
  return (
    <>
      <Panel
        title="Weekly retention cohorts"
        description="Grouped by signup week · return activity observed through the selected end date"
        action={<Badge>Weekly</Badge>}
      >
        <div className="heatmap-scroll">
          <table className="heatmap-table">
            <caption className="sr-only">
              Weekly cohort retention. A dash indicates an immature observation
              window. Percentages are the share of cohort users who returned.
            </caption>
            <thead>
              <tr>
                <th>Signup week</th>
                <th>Users</th>
                {Array.from({ length: 9 }, (_, i) => (
                  <th key={i}>W{i}</th>
                ))}
                <th>D1</th>
                <th>D7</th>
                <th>D30</th>
              </tr>
            </thead>
            <tbody>
              {data.retention!.cohorts.map((cohort) => (
                <tr key={cohort.week}>
                  <th scope="row">{shortDate(cohort.week)}</th>
                  <td className="cohort-size">{formatValue(cohort.size)}</td>
                  {[...cohort.weeks, cohort.d1, cohort.d7, cohort.d30].map(
                    (value, i) => (
                      <td
                        key={i}
                        style={heatColor(value)}
                        title={`${shortDate(cohort.week)} · ${i < 9 ? `Week ${i}` : ["D1", "D7", "D30"][i - 9]}: ${value === null ? "Not yet mature" : `${value.toFixed(1)}% returned`}`}
                      >
                        {value === null ? (
                          <span className="immature-cell">—</span>
                        ) : (
                          `${value.toFixed(i === 0 ? 0 : 1)}%`
                        )}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="heatmap-footer">
          <span>— Observation window not yet mature</span>
          <div>
            Lower
            {[10, 25, 40, 60, 85].map((v) => (
              <i key={v} style={heatColor(v)} />
            ))}
            Higher
          </div>
        </div>
      </Panel>
      <div className="retention-notes">
        <div>
          <Icon name="calendar" />
          <div>
            <strong>Compare at the same age</strong>
            <p>
              Read down a column to compare cohorts fairly. Newer cohorts have
              had less time to return.
            </p>
          </div>
        </div>
        <div>
          <Icon name="info" />
          <div>
            <strong>Weekly and daily are different</strong>
            <p>
              W1 measures returns on days 7–13; D7 measures day 7 only. Partial
              signup weeks include only selected dates.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
export function Dashboard({ screen }: { screen: Screen }) {
  const { session } = useApp();
  return (
    <DashboardView
      key={`${screen}:${session.role}:${session.campusId}`}
      screen={screen}
    />
  );
}
function DashboardView({ screen }: { screen: Screen }) {
  const { session, state, setState, ready, bootError } = useApp();
  const [range, setRange] = useState<DateRange>(() =>
    presetRange(screen === "retention" ? 90 : 28),
  );
  const [preset, setPreset] = useState(screen === "retention" ? "90" : "28");
  const [campusId, setCampusId] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [draft, setDraft] = useState(range);
  const [dateError, setDateError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data?: PageData;
    error?: string;
  } | null>(null);
  const scope = session.role === "campus_lead" ? session.campusId! : campusId;
  const queryKey = `${screen}:${range.from}:${range.to}:${scope}:${state}:${attempt}`;
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    loadPage(
      screen,
      { ...range, campusId: scope || undefined },
      { signal: controller.signal, state, session },
    )
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key: queryKey, data });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            key: queryKey,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load metrics.",
          });
      });
    return () => controller.abort();
  }, [ready, screen, range, scope, state, session, queryKey]);
  const current = result?.key === queryKey ? result : null;
  const data = current?.data;
  const error = bootError ?? current?.error;
  const loading = !error && (!ready || !current);
  const catalog = result?.data?.catalog.campuses ?? [];
  const selectCampus = (id: string) => {
    if (session.role !== "campus_lead") setCampusId(id);
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {screen === "overview"
              ? "THE BIG PICTURE"
              : "YOUR COMMUNITY, CLOSER"}
          </p>
          <h1>
            {screenName(screen)}
            <span className="heading-dot">.</span>
          </h1>
          <p className="page-subtitle">{subtitles[screen]}</p>
        </div>
        <div className="page-filters">
          <div className="filter-select">
            <Icon name="campuses" size={15} />
            <select
              aria-label="Campus filter"
              value={scope}
              disabled={session.role === "campus_lead"}
              onChange={(e) => setCampusId(e.target.value)}
            >
              {session.role !== "campus_lead" && (
                <option value="">All campuses</option>
              )}
              {catalog.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.shortName}
                </option>
              ))}
              {session.role === "campus_lead" && !catalog.length && (
                <option value={scope}>Assigned campus</option>
              )}
            </select>
          </div>
          <div className="filter-select">
            <Icon name="calendar" size={15} />
            <select
              aria-label="Date range"
              value={preset}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "custom") {
                  setDraft(range);
                  setCustomOpen(true);
                } else {
                  setRange(presetRange(Number(value)));
                  setCustomOpen(false);
                }
                setPreset(value);
              }}
            >
              <option value="7">Last 7 days</option>
              <option value="28">Last 28 days</option>
              <option value="90">Last 90 days</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
        </div>
      </div>
      {customOpen && (
        <form
          className="custom-range"
          onSubmit={(e) => {
            e.preventDefault();
            const days =
              (Date.parse(draft.to) - Date.parse(draft.from)) / 86400000;
            if (
              !draft.from ||
              !draft.to ||
              !Number.isFinite(days) ||
              days < 0 ||
              days >= 90
            ) {
              setDateError(
                "Choose a range of 1–90 days, with the start before the end.",
              );
              return;
            }
            setDateError("");
            setRange(draft);
            setCustomOpen(false);
          }}
        >
          <label>
            From
            <Input
              type="date"
              aria-label="From date"
              value={draft.from}
              onChange={(e) => setDraft({ ...draft, from: e.target.value })}
              required
            />
          </label>
          <label>
            To
            <Input
              type="date"
              aria-label="To date"
              value={draft.to}
              onChange={(e) => setDraft({ ...draft, to: e.target.value })}
              required
            />
          </label>
          <Button type="submit">Apply dates</Button>
          {dateError && <p role="alert">{dateError}</p>}
        </form>
      )}
      <div className="period-label">
        <span>
          <span className="status-dot" />
          {shortDate(range.from)} – {shortDate(range.to)},{" "}
          {range.to.slice(0, 4)}
        </span>
        <span>
          {session.role === "campus_lead"
            ? "Assigned campus only"
            : "Campus-level aggregates"}{" "}
          · Synthetic data
        </span>
      </div>
      {loading ? (
        <div
          role="status"
          aria-label="Loading dashboard"
          className="loading-state"
        >
          <div className="kpi-grid">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton skeleton-kpi" />
            ))}
          </div>
          <div className="skeleton skeleton-chart" />
          <p>Getting your campus pulse…</p>
        </div>
      ) : error ? (
        <Card className="message-state" role="alert">
          <span className="state-icon">
            <Icon name="retry" size={28} />
          </span>
          <h2>We couldn’t load your metrics</h2>
          <p>{error}</p>
          <Button
            onClick={() => {
              setState("success");
              setAttempt((v) => v + 1);
            }}
          >
            Try again
          </Button>
        </Card>
      ) : data?.empty ? (
        <Card className="message-state">
          <span className="state-icon">
            <Icon name="filter" size={28} />
          </span>
          <h2>No activity in this window</h2>
          <p>
            Try another date range or campus. The preview contains 90 days
            ending 4 October 2026.
          </p>
          <Button
            onClick={() => {
              setState("success");
              setRange(presetRange(screen === "retention" ? 90 : 28));
              setPreset(screen === "retention" ? "90" : "28");
              setCampusId("");
            }}
          >
            Reset filters
          </Button>
        </Card>
      ) : (
        data && (
          <div data-testid="dashboard-ready" className="dashboard-content">
            <div className="kpi-grid">
              {data.kpis.slice(0, 4).map((metric, index) => (
                <KpiCard key={metric.id} metric={metric} index={index} />
              ))}
            </div>
            {data.period.availableDays < data.period.days && (
              <p className="coverage-note">
                This window contains {data.period.availableDays} of{" "}
                {data.period.days} days of fixture data.
              </p>
            )}
            {screen === "overview" ? (
              <OverviewContent data={data} onSelect={selectCampus} />
            ) : screen === "campuses" ? (
              <CampusesContent data={data} onSelect={selectCampus} />
            ) : screen === "growth" ? (
              <GrowthContent data={data} />
            ) : screen === "sparks" ? (
              <SparksContent data={data} />
            ) : (
              <RetentionContent data={data} />
            )}
            <div className="insights">
              {(screen === "overview" && data.campuses?.insights.length
                ? data.campuses.insights
                : data.insights
              )
                .slice(0, 1)
                .map((insight) => (
                  <div
                    className={`insight insight-${insight.kind}`}
                    key={insight.title}
                  >
                    <span className="insight-icon">
                      <Icon
                        name={insight.kind === "attention" ? "info" : "sparks"}
                        size={17}
                      />
                    </span>
                    <div>
                      <strong>{insight.title}</strong>
                      <span>{insight.detail}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )
      )}
      <footer className="page-footer">
        <span>MADE FOR BETTER CAMPUS CONNECTIONS</span>
        <span>
          Mad Monkey AI <span className="footer-dot">·</span> Analytics preview
        </span>
      </footer>
    </>
  );
}
