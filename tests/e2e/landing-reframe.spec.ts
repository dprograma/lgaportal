/**
 * Landing page reframe E2E tests — verifies the client feedback changes:
 * - Projection-first hero messaging
 * - Investment & endowment features visible
 * - Symbiotic benefits section present
 * - Three-audience CTA (LGA / Investor / Citizen)
 * - How it works has investor tab
 *
 * Run with: npx playwright test --project=api landing-reframe
 */

import { test, expect, request as apiRequest } from "@playwright/test";

const BASE = "http://localhost:3000";

async function getPage(path: string) {
  const ctx = await apiRequest.newContext({ baseURL: BASE });
  const res = await ctx.get(path);
  const html = await res.text();
  return { status: res.status(), html };
}

test.describe("Landing page — projection-first messaging", () => {
  test("homepage loads successfully (200)", async () => {
    const { status } = await getPage("/");
    expect(status).toBe(200);
  });

  test("hero does NOT lead with accountability framing", async () => {
    const { html } = await getPage("/");
    // Should NOT have the old accountability-first headline
    expect(html).not.toContain("hold elected officials accountable");
    expect(html).not.toContain("Nigeria&#x27;s first open platform for LGA transparency");
  });

  test("hero has projection/investment messaging", async () => {
    const { html } = await getPage("/");
    expect(html).toContain("Where Nigeria");
    expect(html).toContain("Meet the World");
  });

  test("hero has three CTAs: LGA, Investor, Citizen", async () => {
    const { html } = await getPage("/");
    expect(html).toContain("Showcase Your LGA");
    expect(html).toContain("Explore Opportunities");
    expect(html).toContain("Join as Citizen");
  });

  test("hero trust badges mention investment and endowments", async () => {
    const { html } = await getPage("/");
    expect(html).toContain("Attract real investors");
    expect(html).toContain("Showcase your endowments");
    expect(html).toContain("Earn recognition for performance");
  });
});

test.describe("Landing page — features section", () => {
  test("features section leads with LGA benefit cards", async () => {
    const { html } = await getPage("/");
    expect(html).toContain("Global Endowment Showcase");
    expect(html).toContain("Investor Matchmaking Hub");
    expect(html).toContain("Performance Recognition");
  });

  test("features section does NOT say 'Monitor Local Governance'", async () => {
    const { html } = await getPage("/");
    expect(html).not.toContain("Monitor Local Governance");
  });

  test("features section has correct new title", async () => {
    const { html } = await getPage("/");
    expect(html).toContain("Built to");
    expect(html).toContain("Grow LGAs");
  });
});

test.describe("Landing page — symbiotic benefits section", () => {
  test("symbiotic section is present", async () => {
    const { html } = await getPage("/");
    expect(html).toContain("The 774ng.com Difference");
    expect(html).toContain("A Platform That Works for");
  });

  test("symbiotic section covers all three audiences", async () => {
    const { html } = await getPage("/");
    expect(html).toContain("For LGA Chairmen");
    expect(html).toContain("For Nigerian Citizens");
    expect(html).toContain("For Investors");
  });

  test("symbiotic section has three-way value messaging", async () => {
    const { html } = await getPage("/");
    expect(html).toContain("Project. Attract. Earn Recognition.");
    expect(html).toContain("Inform. Engage. Hold Accountable.");
    expect(html).toContain("Discover. Verify. Connect.");
  });

  test("symbiotic section has symbiotic logic statement", async () => {
    const { html } = await getPage("/");
    expect(html).toContain("when LGAs grow, investors win");
  });
});

test.describe("Landing page — how it works", () => {
  test("how it works has investor-focused LGA messaging", async () => {
    const { html } = await getPage("/");
    expect(html).toContain("Three Paths. One Platform.");
    expect(html).toContain("Showcase Endowments");
    expect(html).toContain("Attract Investors");
  });
});

test.describe("Landing page — CTA section", () => {
  test("CTA has three panels (LGA, Investor, Citizen)", async () => {
    const { html } = await getPage("/");
    expect(html).toContain("Put Your LGA on the Global Map");
    expect(html).toContain("Discover Your Next Investment");
    expect(html).toContain("Stay Informed, Stay Involved");
  });

  test("CTA LGA panel leads with investment benefits", async () => {
    const { html } = await getPage("/");
    expect(html).toContain("Showcase natural endowments to global investors");
    expect(html).toContain("Receive verified investor inquiries directly");
  });

  test("CTA does NOT say 'Transparency Revolution'", async () => {
    const { html } = await getPage("/");
    expect(html).not.toContain("Transparency Revolution");
  });

  test("CTA headline is investment/growth-focused", async () => {
    const { html } = await getPage("/");
    expect(html).toContain("Grow Nigeria from");
  });
});

test.describe("Landing page — transparency section renamed", () => {
  test("transparency section title is now 'Platform Impact'", async () => {
    const { html } = await getPage("/");
    expect(html).toContain("Platform Impact");
    expect(html).toContain("What Good Governance Looks Like");
  });

  test("transparency section does NOT say 'Platform-Wide Accountability'", async () => {
    const { html } = await getPage("/");
    expect(html).not.toContain("Platform-Wide Accountability");
  });
});

test.describe("Landing page — invest nigeria section", () => {
  test("InvestNigeria section is present and has correct content", async () => {
    const { html } = await getPage("/");
    expect(html).toContain("Nigeria&#x27;s LGAs Are");
    expect(html).toContain("Open for Business");
    expect(html).toContain("Investment Opportunities");
  });
});
