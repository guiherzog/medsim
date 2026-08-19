import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { loadCaseSpec } from "../../lib/engine/loadCaseSpec";

const spec = loadCaseSpec(path.join(__dirname, "../../content/cases/dor-toracica-iam-vd.yaml"));

async function login(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Entrar como usuário de teste (dev)" }).click();
  await expect(page).toHaveURL(/\/cases$/);
}

async function takeCase(page: Page) {
  await page.goto(`/cases/${spec.slug}`);
  await expect(page.getByRole("button", { name: "Assumir o caso" })).toBeVisible();
  await page.getByRole("button", { name: "Assumir o caso" }).click();
  await expect(page).toHaveURL(new RegExp(`/cases/${spec.slug}/run/`));
}

test("a perfect run scores full marks and the debrief explains each decision", async ({ page }) => {
  await login(page);
  await takeCase(page);

  // The monitor is live from the first frame.
  await expect(page.getByText("Ao vivo")).toBeVisible();

  for (const step of spec.steps) {
    const correct = step.options.find((o) => o.correct)!;
    await page.getByRole("button", { name: correct.label }).click({ timeout: 20000 });
  }

  await expect(page).toHaveURL(new RegExp(`/cases/${spec.slug}/debrief/`), { timeout: 20000 });
  const max = spec.steps.length * spec.scoring.pointsPerCorrectDecision;
  await expect(page.getByText("Paciente estabilizado")).toBeVisible();
  await expect(page.getByText(`/${max}`)).toBeVisible();
  await expect(page.getByText("Nenhum erro crítico e nenhuma decisão perdida por tempo.")).toBeVisible();

  // Every decision's rationale is available for review.
  for (const step of spec.steps) {
    const correct = step.options.find((o) => o.correct)!;
    await expect(page.getByText(correct.rationale.trim().slice(0, 40))).toBeVisible();
  }
});

test("a critical error is penalised and the patient visibly deteriorates", async ({ page }) => {
  await login(page);
  await takeCase(page);

  const step = spec.steps[0];
  const critical = step.options.find((o) => o.critical)!;
  await page.getByRole("button", { name: critical.label }).click();

  // The consequence is narrated, and the screen escalates to the dying state.
  await expect(page.getByText(critical.feed.trim().slice(0, 40))).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("O paciente está morrendo — aja agora")).toBeVisible({ timeout: 20000 });

  // Finish the run with correct calls; the critical error must still cost points.
  for (const s of spec.steps.slice(1)) {
    const correct = s.options.find((o) => o.correct)!;
    await page.getByRole("button", { name: correct.label }).click({ timeout: 25000 });
  }

  await expect(page).toHaveURL(new RegExp(`/cases/${spec.slug}/debrief/`), { timeout: 20000 });
  await expect(page.getByText("Desfecho comprometido")).toBeVisible();
  await expect(page.getByText(/1 erro\(s\) crítico\(s\)/)).toBeVisible();
});
