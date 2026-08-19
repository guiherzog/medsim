import { test, expect } from "@playwright/test";

// iPhone 13 viewport, kept on the default Chromium project (no extra WebKit
// browser download) since this is checking layout/overflow, not engine quirks.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test("case list and case intro are usable on a mobile viewport", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Entrar como usuário de teste (dev)" }).click();
  await expect(page).toHaveURL(/\/cases$/);

  // No horizontal scroll on the case list.
  const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasHorizontalScroll).toBe(false);

  await page.getByText("Dor torácica em homem de 58 anos").click();
  await expect(page.getByRole("button", { name: "Assumir o caso" })).toBeVisible();

  const hasHorizontalScrollOnDetail = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalScrollOnDetail).toBe(false);
});

test("the activity log gets the majority of the run screen on a phone", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Entrar como usuário de teste (dev)" }).click();
  await expect(page).toHaveURL(/\/cases$/);
  await page.goto("/cases/dor-toracica-iam-vd");
  await page.getByRole("button", { name: "Assumir o caso" }).click();
  await expect(page).toHaveURL(/\/run\//);
  await expect(page.getByText("Ao vivo")).toBeVisible();

  const sizes = await page.evaluate(() => {
    const log = document.querySelector('[class*="overflow-y-auto"]') as HTMLElement;
    const monitor = document.querySelector('[class*="rounded-2xl"]') as HTMLElement;
    return {
      log: log.getBoundingClientRect().height,
      monitor: monitor.getBoundingClientRect().height,
      viewport: window.innerHeight,
      scroll: document.documentElement.scrollHeight,
    };
  });

  // The log used to get ~9% of an 844px phone screen while the monitor took 37%.
  expect(sizes.log).toBeGreaterThan(sizes.monitor);
  expect(sizes.log / sizes.viewport).toBeGreaterThan(0.3);
  // And the run screen must not spill into a body scroll.
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.viewport + 1);
});
