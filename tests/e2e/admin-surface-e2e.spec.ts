/**
 * API contract tests for the ADMIN surface — verifies each admin read endpoint
 * is auth-gated (rejects requests without the admin secret) and returns its
 * documented shape when authenticated.
 *
 * Run with:  npx playwright test --project=api admin-surface-e2e
 *
 * Requires ADMIN_SECRET (or NEXT_PUBLIC_ADMIN_SECRET) in .env.local.
 */

import { test, expect, request as apiRequest } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local" });

const BASE = "http://localhost:3000";
const SECRET = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";
const ADMIN = { "x-admin-secret": SECRET };

async function get(path: string, headers: Record<string, string> = {}) {
  const ctx = await apiRequest.newContext({ baseURL: BASE });
  const res = await ctx.get(path, { headers });
  const body = await res.json().catch(() => ({}));
  return { status: res.status(), body };
}

// endpoint → a key expected in the authenticated response
const ADMIN_GETS: Array<{ path: string; key: string }> = [
  { path: "/api/admin/analytics",     key: "lgas" },
  { path: "/api/admin/revenue",       key: "totalRevenue" },
  { path: "/api/admin/reports",       key: "reports" },
  { path: "/api/admin/moderation",    key: "pendingReports" },
  { path: "/api/admin/users",         key: "users" },
  { path: "/api/admin/allocations",   key: "records" },
  { path: "/api/admin/audit-reports", key: "reports" },
  { path: "/api/admin/live-streams",  key: "streams" },
  { path: "/api/admin/ad-plans",      key: "plans" },
  { path: "/api/admin/lgas/expiring", key: "expiring" },
];

test.describe("Admin surface — auth gating", () => {
  for (const { path } of ADMIN_GETS) {
    test(`${path} without the admin secret is rejected (401/403)`, async () => {
      const { status } = await get(path);
      expect([401, 403]).toContain(status);
    });
  }

  test("a wrong admin secret is rejected (401/403)", async () => {
    const { status } = await get("/api/admin/users", { "x-admin-secret": "totally-wrong" });
    expect([401, 403]).toContain(status);
  });
});

test.describe("Admin surface — authenticated shape", () => {
  test.skip(!SECRET, "ADMIN_SECRET not set");

  for (const { path, key } of ADMIN_GETS) {
    test(`${path} with the admin secret → 200 including "${key}"`, async () => {
      const { status, body } = await get(path, ADMIN);
      expect(status).toBe(200);
      expect(key in body).toBe(true);
    });
  }
});
