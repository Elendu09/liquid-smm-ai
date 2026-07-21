/**
 * Phase 10 e2e — sign in as a fresh user, walk every hub, assert
 * no synth/demo strings render for authenticated sessions.
 *
 * Run: npx playwright test e2e/no-synth.spec.ts
 * Requires: TEST_USER / TEST_PASS env vars, dev server on :8080.
 */
import { test, expect, Page } from "@playwright/test";

const HUBS = [
  "/dashboard",
  "/dashboard/analytics",
  "/dashboard/create",
  "/dashboard/publish",
  "/dashboard/engage",
  "/dashboard/audience",
  "/dashboard/library",
  "/dashboard/activity",
  "/dashboard/settings",
];

const SYNTH_STRINGS = [
  "Demo data",
  "Sample call",
  "Product launch teaser",
  "Behind the scenes reel",
  "Old sale caption",
  "Auto-reply to @jordan.creates",
  "Untitled draft",
];

async function assertClean(page: Page, route: string) {
  await page.goto(`http://localhost:8080${route}`, { waitUntil: "networkidle" });
  const html = (await page.content()).toLowerCase();
  for (const s of SYNTH_STRINGS) {
    expect(html, `synth string "${s}" leaked at ${route}`).not.toContain(
      s.toLowerCase(),
    );
  }
}

test.describe("signed-in user sees no synth data", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:8080/login");
    await page.getByLabel(/email/i).fill(process.env.TEST_USER ?? "");
    await page.getByLabel(/password/i).fill(process.env.TEST_PASS ?? "");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);
  });

  for (const route of HUBS) {
    test(`hub ${route} is clean`, async ({ page }) => {
      await assertClean(page, route);
    });
  }
});
