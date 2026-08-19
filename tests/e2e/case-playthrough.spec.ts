import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { loadCaseSpec } from "../../lib/engine/loadCaseSpec";

const caseSpec = loadCaseSpec(path.join(__dirname, "../../content/cases/dor-toracica-iam-vd.yaml"));

async function login(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Entrar como usuário de teste (dev)" }).click();
  await expect(page).toHaveURL(/\/cases$/);
}

test("perfect playthrough of dor-toracica-iam-vd scores full marks and shows rationale in debrief", async ({ page }) => {
  await login(page);

  // Hard-gated timer (plan.md Q8): install the mocked clock before the page's own
  // setInterval starts, then fast-forward instead of waiting 150s for real.
  await page.clock.install();
  await page.goto(`/cases/${caseSpec.slug}`);
  await expect(page.getByText(caseSpec.title)).toBeVisible();
  // runFor (not fastForward) actually fires the recurring setInterval tick-by-tick.
  await page.clock.runFor("00:02:35");
  await page.getByRole("button", { name: "Ver evolução" }).click();
  await expect(page).toHaveURL(new RegExp(`/cases/${caseSpec.slug}/run/`));

  for (const evolution of caseSpec.evolutions) {
    await expect(page.getByText(evolution.narrative.trim().slice(0, 30))).toBeVisible();

    const criticalOption = evolution.options.find((o) => o.critical)!;

    for (const option of evolution.options) {
      const row = page.getByTestId(`option-${option.id}`);
      await row.getByRole("button", { name: option.correct ? "Correta" : "Incorreta", exact: true }).click();
    }

    // "most dangerous" pick is unrestricted (Q6) — here we correctly flag the actual critical option.
    await page.getByTestId(`option-${criticalOption.id}`).getByRole("radio").click();

    await page.getByRole("button", { name: "Confirmar respostas" }).click();

    await expect(
      page.getByText(`Você marcou ${caseSpec.scoring.perEvolutionMax} de ${caseSpec.scoring.perEvolutionMax} pontos`),
    ).toBeVisible();
    await expect(page.getByText("Você identificou corretamente o erro crítico.")).toBeVisible();

    const isLast = evolution.id === caseSpec.evolutions[caseSpec.evolutions.length - 1].id;
    await page.getByRole("button", { name: isLast ? "Ver resultado final" : "Próxima evolução" }).click();
  }

  await expect(page).toHaveURL(new RegExp(`/cases/${caseSpec.slug}/debrief/`));
  const maxTotal = caseSpec.evolutions.length * caseSpec.scoring.perEvolutionMax;
  await expect(page.getByText(`${maxTotal} de ${maxTotal} pontos`)).toBeVisible();

  // Rationale review shows all 6 options per evolution, not just the critical one (plan.md Q5).
  for (const evolution of caseSpec.evolutions) {
    for (const option of evolution.options) {
      await expect(page.getByText(option.rationale)).toBeVisible();
    }
  }
});
