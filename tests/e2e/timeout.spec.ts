import path from "node:path";
import { test, expect } from "@playwright/test";
import { loadCaseSpec } from "../../lib/engine/loadCaseSpec";

const spec = loadCaseSpec(path.join(__dirname, "../../content/cases/dor-toracica-iam-vd.yaml"));
const firstStep = spec.steps[0];

// The decision clock is real time, so allow for it.
test.setTimeout(150_000);

test("letting the decision clock expire costs the decision and is reported as a timeout", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Entrar como usuário de teste (dev)" }).click();
  await expect(page).toHaveURL(/\/cases$/);
  await page.goto(`/cases/${spec.slug}`);
  await page.getByRole("button", { name: "Assumir o caso" }).click();
  await expect(page).toHaveURL(new RegExp(`/cases/${spec.slug}/run/`));

  // Deliberately do nothing for the whole window.
  await expect(page.getByText("Tempo esgotado")).toBeVisible({
    timeout: (firstStep.decisionSeconds + 15) * 1000,
  });
  // Fires exactly once, not once per re-render.
  await expect(page.getByText("Tempo esgotado")).toHaveCount(1);

  for (const s of spec.steps.slice(1)) {
    const correct = s.options.find((o) => o.correct)!;
    await page.getByRole("button", { name: correct.label }).click({ timeout: 25000 });
  }

  await expect(page).toHaveURL(new RegExp(`/cases/${spec.slug}/debrief/`), { timeout: 20000 });
  await expect(page.getByText(/1 decisão\(ões\) perdida\(s\) por tempo/)).toBeVisible();
});
