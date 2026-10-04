import { delay, http, HttpResponse } from "msw";
import type { DateRange, Role } from "@/lib/api/types";
import { getSession, roles } from "@/lib/auth/session";
import {
  ambassadorYield,
  campusList,
  campusMetrics,
  overview,
  retention,
  sources,
  sparksSummary,
} from "./fixtures/analytics";
import { campuses, DATA_END, DEFAULT_FROM, daysBetween } from "./fixtures/data";

function error(status: number, code: string, message: string) {
  return HttpResponse.json({ code, message }, { status });
}
function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function parseRequest(
  request: Request,
  campusPath?: string,
): DateRange | ReturnType<typeof error> {
  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? DEFAULT_FROM,
    to = url.searchParams.get("to") ?? DATA_END;
  if (
    !validDate(from) ||
    !validDate(to) ||
    daysBetween(from, to) < 0 ||
    daysBetween(from, to) >= 90
  )
    return error(
      400,
      "INVALID_RANGE",
      "Choose a valid date range of 1-90 days.",
    );
  if (
    url.searchParams.has("cohort") &&
    url.searchParams.get("cohort") !== "weekly"
  )
    return error(400, "INVALID_COHORT", "Only weekly cohorts are supported.");
  const rawRole = request.headers.get("x-mock-role") ?? "ceo";
  if (!roles.includes(rawRole as Role))
    return error(403, "INVALID_ROLE", "Unknown preview role.");
  const assignedCampus = request.headers.get("x-mock-campus") ?? "christ";
  const requestedCampus =
    campusPath ?? url.searchParams.get("campusId") ?? undefined;
  if (
    rawRole === "campus_lead" &&
    requestedCampus &&
    requestedCampus !== assignedCampus
  )
    return error(
      403,
      "CAMPUS_FORBIDDEN",
      "This campus is outside your assigned scope.",
    );
  const campusId = rawRole === "campus_lead" ? assignedCampus : requestedCampus;
  if (campusId && !campuses.some((c) => c.id === campusId))
    return error(404, "CAMPUS_NOT_FOUND", "This campus does not exist.");
  return { from, to, campusId };
}
async function scenario(request: Request) {
  const state = request.headers.get("x-mock-state");
  await delay(state === "loading" ? 60_000 : 180);
  return state === "error"
    ? error(
        503,
        "MOCK_UNAVAILABLE",
        "Metrics are temporarily unavailable. Try again.",
      )
    : null;
}
function analyticsHandler(
  path: string,
  build: (range: DateRange, empty: boolean) => unknown,
) {
  return http.get(`*/api/${path}`, async ({ request, params }) => {
    const range = parseRequest(
      request,
      typeof params.id === "string" ? params.id : undefined,
    );
    if (range instanceof HttpResponse) return range;
    const failure = await scenario(request);
    if (failure) return failure;
    return HttpResponse.json(
      build(range, request.headers.get("x-mock-state") === "empty") as Record<
        string,
        unknown
      >,
    );
  });
}
export const handlers = [
  http.get("*/api/me", ({ request }) => {
    const role = (request.headers.get("x-mock-role") ?? "ceo") as Role;
    if (!roles.includes(role))
      return error(403, "INVALID_ROLE", "Unknown preview role.");
    return HttpResponse.json(
      getSession({
        role,
        campusId: request.headers.get("x-mock-campus") ?? "christ",
      }),
    );
  }),
  analyticsHandler("metrics/overview", overview),
  analyticsHandler("metrics/retention", retention),
  analyticsHandler("campuses", campusList),
  analyticsHandler("campuses/:id/metrics", campusMetrics),
  analyticsHandler("growth/sources", sources),
  analyticsHandler("growth/ambassadors", ambassadorYield),
  analyticsHandler("sparks/summary", sparksSummary),
];
