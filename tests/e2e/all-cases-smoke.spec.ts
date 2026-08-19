import path from "node:path";
import { readdirSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { loadCaseSpec } from "../../lib/engine/loadCaseSpec";

const casesDir = path.join(__dirname, "../../content/cases");
const caseSpecs = readdirSync(casesDir)
  .filter((f) => f.endsWith(".yaml"))
  .map((f) => loadCaseSpec(path.join(casesDir, f)));

for (const caseSpec of caseSpecs) {
  test(`${caseSpec.slug}: first evolution scores full marks with correct answers`, async ({ page }) => {
    await page.clock.install();
    await page.goto("/login");
    await page.getByRole("button", { name: "Entrar como usuário de teste (dev)" }).click();
    await expect(page).toHaveURL(/\/cases$/);

    await page.goto(`/cases/${caseSpec.slug}`);
    await expect(page.getByText(caseSpec.title)).toBeVisible();
    await page.getByRole("button", { name: /Aguarde/ }).waitFor();
    await page.clock.runFor("00:03:00");
    await page.getByRole("button", { name: "Ver evolução" }).click();
    await expect(page).toHaveURL(new RegExp(`/cases/${caseSpec.slug}/run/`));

    const firstEvolution = caseSpec.evolutions[0];
    for (const option of firstEvolution.options) {
      await page
        .getByTestId(`option-${option.id}`)
        .getByRole("button", { name: option.correct ? "Correta" : "Incorreta", exact: true })
        .click();
    }
    const criticalOption = firstEvolution.options.find((o) => o.critical)!;
    await page.getByTestId(`option-${criticalOption.id}`).getByRole("radio").click();

    await page.getByRole("button", { name: "Confirmar respostas" }).click();
    await expect(
      page.getByText(`Você marcou ${caseSpec.scoring.perEvolutionMax} de ${caseSpec.scoring.perEvolutionMax} pontos`),
    ).toBeVisible();
  });
}
