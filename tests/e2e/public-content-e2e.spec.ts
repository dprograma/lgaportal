/**
 * API contract tests for the PUBLIC content & discovery surface — the read-only
 * endpoints that power the landing page, maps, listings and public detail pages.
 * No authentication; pure HTTP shape/contract checks.
 *
 * Run with:  npx playwright test --project=api public-content-e2e
 */

import { test, expect, request as apiRequest } from "@playwright/test";

const BASE = "http://localhost:3000";

async function get(path: string) {
  const ctx = await apiRequest.newContext({ baseURL: BASE });
  const res = await ctx.get(path);
  const body = await res.json().catch(() => ({}));
  return { status: res.status(), body };
}

test.describe("Public content & discovery", () => {
  test("GET /api/map/data?type=lgas → 200 with lgas array", async () => {
    const { status, body } = await get("/api/map/data?type=lgas");
    expect(status).toBe(200);
    expect(Array.isArray(body.lgas)).toBe(true);
  });

  test("GET /api/live-streams → 200 with streams array", async () => {
    const { status, body } = await get("/api/live-streams");
    expect(status).toBe(200);
    expect(Array.isArray(body.streams)).toBe(true);
  });

  test("GET /api/public/stats → 200 with numeric counters", async () => {
    const { status, body } = await get("/api/public/stats");
    expect(status).toBe(200);
    expect(typeof body.approvedLGAs).toBe("number");
    expect(typeof body.totalProjects).toBe("number");
  });

  test("GET /api/public/testimonials → 200 with testimonials array", async () => {
    const { status, body } = await get("/api/public/testimonials");
    expect(status).toBe(200);
    expect(Array.isArray(body.testimonials)).toBe(true);
  });

  test("GET /api/lgas/featured → 200 with lgas array", async () => {
    const { status, body } = await get("/api/lgas/featured");
    expect(status).toBe(200);
    expect(Array.isArray(body.lgas)).toBe(true);
  });

  test("GET /api/lgas/list → 200 with lgas array", async () => {
    const { status, body } = await get("/api/lgas/list?limit=5");
    expect(status).toBe(200);
    expect(Array.isArray(body.lgas)).toBe(true);
  });

  test("GET /api/lgas/by-slug for an unknown slug → 404", async () => {
    const { status } = await get("/api/lgas/by-slug?slug=definitely-not-a-real-lga-xyz");
    expect(status).toBe(404);
  });

  test("GET /api/ad-plans → 200 with plans array", async () => {
    const { status, body } = await get("/api/ad-plans");
    expect(status).toBe(200);
    expect(Array.isArray(body.plans)).toBe(true);
  });

  test("GET /api/press-releases → 200 with releases array + total", async () => {
    const { status, body } = await get("/api/press-releases");
    expect(status).toBe(200);
    expect(Array.isArray(body.releases)).toBe(true);
    expect(typeof body.total).toBe("number");
  });

  test("GET /api/allocations → 200 with records/total/years", async () => {
    const { status, body } = await get("/api/allocations");
    expect(status).toBe(200);
    expect(Array.isArray(body.records)).toBe(true);
    expect(typeof body.total).toBe("number");
    expect(Array.isArray(body.years)).toBe(true);
  });

  test("GET /api/allocations/compare without lgas/states → 400", async () => {
    const { status } = await get("/api/allocations/compare");
    expect(status).toBe(400);
  });

  test("GET /api/allocations/compare?states=Lagos → 200", async () => {
    const { status } = await get("/api/allocations/compare?states=Lagos");
    expect(status).toBe(200);
  });

  test("GET /api/ads → 200 (single ad slot, may be null)", async () => {
    const { status, body } = await get("/api/ads");
    expect(status).toBe(200);
    expect("ad" in body).toBe(true);
  });
});
