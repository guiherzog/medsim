import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadCaseSpec } from "../loadCaseSpec";
import { scoreRun } from "../scoreRun";
import { patientStateOf, severityOf } from "../vitalStatus";
import type { RecordedDecision } from "../types";

const casesDir = path.join(__dirname, "../../../content/cases");
const caseFiles = readdirSync(casesDir).filter((f) => f.endsWith(".yaml"));

describe("real case YAML files", () => {
  it("has exactly the 3 cases from plan.md", () => {
    expect(caseFiles.sort()).toEqual(
      [
        "anafilaxia-amoxicilina.yaml",
        "dor-toracica-iam-vd.yaml",
        "sepse-urinaria-idoso.yaml",
      ].sort(),
    );
  });

  for (const file of caseFiles) {
    describe(file, () => {
      const spec = loadCaseSpec(path.join(casesDir, file));

      it("validates against the Phase 2 schema", () => {
        expect(spec.steps.length).toBeGreaterThanOrEqual(3);
        // AI-drafted (plan.md Q1/Q12): never a fabricated sign-off.
        expect(spec.approval).toBeUndefined();
        expect(spec.disclaimer.length).toBeGreaterThan(0);
      });

      it("gives every step a clock, a timeout consequence and authored options", () => {
        for (const step of spec.steps) {
          expect(step.decisionSeconds).toBeGreaterThan(0);
          expect(step.timeout.feed.length).toBeGreaterThan(0);
          expect(step.options.length).toBeGreaterThanOrEqual(2);
          expect(step.options.some((o) => o.correct)).toBe(true);
          expect(step.options.filter((o) => o.critical).length).toBeLessThanOrEqual(1);
          for (const option of step.options) {
            expect(option.rationale.length).toBeGreaterThan(0);
            expect(option.feed.length).toBeGreaterThan(0);
          }
        }
      });

      it("flags exactly one critical error per step, and it is never a correct option", () => {
        for (const step of spec.steps) {
          const critical = step.options.filter((o) => o.critical);
          expect(critical).toHaveLength(1);
          expect(critical[0].correct).toBe(false);
        }
      });

      it("has a reachable terminal step", () => {
        const terminal = spec.steps.some((s) => s.options.some((o) => o.next === null));
        expect(terminal).toBe(true);
      });

      it("scores a perfect run at full marks and an all-critical run at zero", () => {
        const best: RecordedDecision[] = spec.steps.map((s, i) => ({
          stepId: s.id,
          optionId: s.options.find((o) => o.correct)!.id,
          timedOut: false,
          at: i * 10,
        }));
        const worst: RecordedDecision[] = spec.steps.map((s, i) => ({
          stepId: s.id,
          optionId: s.options.find((o) => o.critical)!.id,
          timedOut: false,
          at: i * 10,
        }));

        const good = scoreRun(spec, best);
        expect(good.score).toBe(good.maxScore);
        expect(good.criticalErrors).toBe(0);

        const bad = scoreRun(spec, worst);
        expect(bad.score).toBe(0);
        expect(bad.criticalErrors).toBe(spec.steps.length);
      });

      it("authors vitals that actually register as abnormal when they should", () => {
        // A case whose readings all sat in the normal band would never light up
        // the monitor, which is the whole point of the format.
        const anyAbnormal = spec.steps.some(
          (s) => patientStateOf(s.vitals) !== "stable" || severityOf("pa", s.vitals) !== "normal",
        );
        expect(anyAbnormal).toBe(true);
      });
    });
  }
});
