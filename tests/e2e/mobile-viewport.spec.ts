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
