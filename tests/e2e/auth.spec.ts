import { test, expect } from "@playwright/test";

test("unauthenticated visitor is redirected to /login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Entrar", { exact: true })).toBeVisible();
});

test("dev login lands on the authenticated shell", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Entrar como usuário de teste (dev)" }).click();
  await expect(page).toHaveURL(/\/cases$/);
  await expect(page.getByText("dev@medsim.local")).toBeVisible();
});
