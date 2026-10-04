import type {
  AmbassadorsResponse,
  Analytics,
  ApiError,
  CampusesResponse,
  DateRange,
  MockState,
  RetentionResponse,
  Session,
  SourcesResponse,
  SparksResponse,
} from "./types";
import { getSession } from "@/lib/auth/session";
let workerReady: Promise<unknown> | undefined;
export async function initializeMocks() {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "false")
    throw new Error(
      "This frontend preview requires mocks. Real API connections are disabled.",
    );
  if (typeof window === "undefined")
    throw new Error("The mock client runs in the browser.");
  if (!workerReady)
    workerReady = import("@/mocks/browser")
      .then(({ worker }) =>
        worker.start({
          quiet: true,
          onUnhandledRequest(request, print) {
            if (new URL(request.url).pathname.startsWith("/api/"))
              print.error();
          },
        }),
      )
      .catch((error: unknown) => {
        workerReady = undefined;
        throw error;
      });
  return workerReady;
}
export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}
export interface RequestOptions {
  signal?: AbortSignal;
  state?: MockState;
  session?: Session;
}
async function request<T>(
  path: string,
  range?: DateRange,
  options: RequestOptions = {},
): Promise<T> {
  await initializeMocks();
  const session = options.session ?? getSession();
  const params = new URLSearchParams();
  if (range) {
    params.set("from", range.from);
    params.set("to", range.to);
    if (range.campusId) params.set("campusId", range.campusId);
  }
  if (path === "/api/metrics/retention") params.set("cohort", "weekly");
  const response = await fetch(`${path}${params.size ? `?${params}` : ""}`, {
    signal: options.signal,
    cache: "no-store",
    headers: {
      "x-mock-role": session.role,
      "x-mock-campus": session.campusId ?? "christ",
      "x-mock-state": options.state ?? "success",
    },
  });
  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new ApiClientError(error.message, response.status);
  }
  return response.json() as Promise<T>;
}
export const api = {
  me: (options?: RequestOptions) =>
    request<Session>("/api/me", undefined, options),
  overview: (range: DateRange, options?: RequestOptions) =>
    request<Analytics>("/api/metrics/overview", range, options),
  campuses: (range: DateRange, options?: RequestOptions) =>
    request<CampusesResponse>("/api/campuses", range, options),
  campusMetrics: (id: string, range: DateRange, options?: RequestOptions) =>
    request<Analytics>(
      `/api/campuses/${encodeURIComponent(id)}/metrics`,
      { from: range.from, to: range.to },
      options,
    ),
  sources: (range: DateRange, options?: RequestOptions) =>
    request<SourcesResponse>("/api/growth/sources", range, options),
  ambassadors: (range: DateRange, options?: RequestOptions) =>
    request<AmbassadorsResponse>("/api/growth/ambassadors", range, options),
  sparks: (range: DateRange, options?: RequestOptions) =>
    request<SparksResponse>("/api/sparks/summary", range, options),
  retention: (range: DateRange, options?: RequestOptions) =>
    request<RetentionResponse>("/api/metrics/retention", range, options),
};
