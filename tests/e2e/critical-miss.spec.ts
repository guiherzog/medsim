import path from "node:path";
import { test, expect } from "@playwright/test";
import { loadCaseSpec } from "../../lib/engine/loadCaseSpec";

const caseSpec = loadCaseSpec(path.join(__dirname, "../../content/cases/dor-toracica-iam-vd.yaml"));
const firstEvolution = caseSpec.evolutions[0];

test("deliberately missing the critical error is flagged immediately and in the debrief breakdown", async ({ page }) => {
  await page.clock.install();
  await page.goto("/login");
  await page.getByRole("button", { name: "Entrar como usuário de teste (dev)" }).click();
  await expect(page).toHaveURL(/\/cases$/);

  await page.goto(`/cases/${caseSpec.slug}`);
  await page.clock.runFor("00:02:35");
  await page.getByRole("button", { name: "Ver evolução" }).click();
  await expect(page).toHaveURL(new RegExp(`/cases/${caseSpec.slug}/run/`));

  // Classify every option correctly (so only the critical-pick is deliberately wrong).
  for (const option of firstEvolution.options) {
    await page
      .getByTestId(`option-${option.id}`)
      .getByRole("button", { name: option.correct ? "Correta" : "Incorreta", exact: true })
      .click();
  }

  // Deliberately flag a non-critical incorrect option as "most dangerous" instead of the real critical one.
  const decoyOption = firstEvolution.options.find((o) => !o.correct && !o.critical)!;
  await page.getByTestId(`option-${decoyOption.id}`).getByRole("radio").click();

  await page.getByRole("button", { name: "Confirmar respostas" }).click();

  // Immediate per-evolution feedback: 6/8 (classification points only, no critical bonus) and the miss called out.
  await expect(page.getByText(`Você marcou 6 de ${caseSpec.scoring.perEvolutionMax} pontos`)).toBeVisible();
  await expect(page.getByText("Você não identificou o erro crítico desta evolução.")).toBeVisible();
});
