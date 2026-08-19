import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadCaseSpec } from "../loadCaseSpec";

const casesDir = path.join(__dirname, "../../../content/cases");
const caseFiles = readdirSync(casesDir).filter((f) => f.endsWith(".yaml"));

describe("real case YAML files", () => {
  it("has exactly the 3 cases from plan.md", () => {
    expect(caseFiles.sort()).toEqual(
      ["anafilaxia-amoxicilina.yaml", "dor-toracica-iam-vd.yaml", "sepse-urinaria-idoso.yaml"].sort(),
    );
  });

  for (const file of caseFiles) {
    it(`${file} parses and validates against caseSpecSchema`, () => {
      const spec = loadCaseSpec(path.join(casesDir, file));

      expect(spec.evolutions).toHaveLength(3);
      expect(spec.approval).toBeUndefined(); // AI-invented drafts (plan.md Q1/Q12): never a fabricated sign-off
      expect(spec.disclaimer.length).toBeGreaterThan(0);

      for (const evolution of spec.evolutions) {
        expect(evolution.options).toHaveLength(6);
        expect(evolution.options.filter((o) => o.correct)).toHaveLength(3);
        expect(evolution.options.filter((o) => o.critical)).toHaveLength(1);
        expect(evolution.options.every((o) => o.rationale.length > 0)).toBe(true);
      }
    });
  }

  it("totals 72 points across all 9 evoluções (8 per evolution x 9)", () => {
    const totalMax = caseFiles
      .map((f) => loadCaseSpec(path.join(casesDir, f)))
      .flatMap((spec) => spec.evolutions.map(() => spec.scoring.perEvolutionMax))
      .reduce((sum, max) => sum + max, 0);
    expect(totalMax).toBe(72);
  });
});
