import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { setupServer } from "msw/node";
import { readFileSync } from "node:fs";
import { handlers } from "./handlers";
import type {
  CampusesResponse,
  AmbassadorsResponse,
  Session,
} from "@/lib/api/types";
const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
// Test transport only: MSW intercepts every request before any network access.
async function request<T = Record<string, unknown>>(
  path: string,
  headers: Record<string, string> = {},
) {
  const response = await globalThis.fetch(`http://localhost${path}`, {
    headers,
  });
  return { status: response.status, body: (await response.json()) as T };
}
const endpoints = [
  "/api/me",
  "/api/metrics/overview",
  "/api/metrics/retention",
  "/api/campuses",
  "/api/campuses/christ/metrics",
  "/api/growth/sources",
  "/api/growth/ambassadors",
  "/api/sparks/summary",
];
describe("eight-endpoint mock contract", () => {
  it("documents exactly the README endpoints", () => {
    const contract = readFileSync("docs/api-contract.yaml", "utf8");
    const paths = [...contract.matchAll(/^  "(\/api\/[^"]+)":$/gm)].map(
      (m) => m[1],
    );
    expect(paths.sort()).toEqual(
      endpoints.map((p) => p.replace("christ/metrics", "{id}/metrics")).sort(),
    );
  });
  it.each(endpoints)("responds to %s", async (path) => {
    expect((await request(path)).status).toBe(200);
  });
  it("returns only assigned campus data to campus leads even without a filter", async () => {
    const headers = { "x-mock-role": "campus_lead", "x-mock-campus": "jain" };
    const list = await request<CampusesResponse>("/api/campuses", headers);
    expect(list.body.campuses.map((c) => c.id)).toEqual(["jain"]);
    const ambassadors = await request<AmbassadorsResponse>(
      "/api/growth/ambassadors",
      headers,
    );
    expect(
      ambassadors.body.ambassadors.every((a) => a.campusId === "jain"),
    ).toBe(true);
  });
  it.each(endpoints.filter((p) => p !== "/api/me"))(
    "rejects cross-campus access at %s",
    async (path) => {
      expect(
        (
          await request(`${path}?campusId=christ`, {
            "x-mock-role": "campus_lead",
            "x-mock-campus": "jain",
          })
        ).status,
      ).toBe(403);
    },
  );
  it("exposes staff preview records to admin only", async () => {
    expect((await request<Session>("/api/me")).body.managedUsers).toEqual([]);
    expect(
      (await request<Session>("/api/me", { "x-mock-role": "admin" })).body
        .managedUsers.length,
    ).toBeGreaterThan(0);
  });
  it("validates invalid dates, inverted and oversized ranges, unknown campuses, and cohort values", async () => {
    for (const query of [
      "from=2026-02-30",
      "from=2026-10-04&to=2026-09-01",
      "from=2026-01-01&to=2026-10-04",
      "cohort=daily",
    ])
      expect((await request(`/api/metrics/retention?${query}`)).status).toBe(
        400,
      );
    expect((await request("/api/campuses/unknown/metrics")).status).toBe(404);
  });
  it("supports explicit error and empty scenarios", async () => {
    expect(
      (await request("/api/metrics/overview", { "x-mock-state": "error" }))
        .status,
    ).toBe(503);
    expect(
      (
        await request<CampusesResponse>("/api/campuses", {
          "x-mock-state": "empty",
        })
      ).body.campuses,
    ).toEqual([]);
  });
});
