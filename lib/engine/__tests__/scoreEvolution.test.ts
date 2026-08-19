import { describe, expect, it } from "vitest";
import { scoreEvolution } from "../scoreEvolution";
import type { UserSelections } from "../types";
import { fixtureEvolution } from "./fixtures";

const PER_OPTION = 1;
const CRITICAL_BONUS = 2;

function score(selections: UserSelections) {
  return scoreEvolution(fixtureEvolution, selections, PER_OPTION, CRITICAL_BONUS);
}

describe("scoreEvolution", () => {
  it("awards full marks for an all-correct classification with the critical option identified", () => {
    const result = score({
      calls: { a1: "correct", a2: "correct", a3: "correct", a4: "incorrect", a5: "incorrect", a6: "incorrect" },
      mostDangerousPick: "a4",
    });
    expect(result.score).toBe(8);
    expect(result.maxScore).toBe(8);
    expect(result.criticalWasIdentified).toBe(true);
    expect(result.criticalWasMissed).toBe(false);
    expect(result.optionResults.every((r) => !r.wasMisclassified)).toBe(true);
  });

  it("awards zero classification points when every call is flipped", () => {
    const result = score({
      calls: { a1: "incorrect", a2: "incorrect", a3: "incorrect", a4: "correct", a5: "correct", a6: "correct" },
      mostDangerousPick: "a1",
    });
    expect(result.score).toBe(0);
    expect(result.optionResults.every((r) => r.wasMisclassified)).toBe(true);
    expect(result.criticalWasIdentified).toBe(false);
    expect(result.criticalWasMissed).toBe(true);
  });

  it("flags the critical option as missed when a different option is picked as most dangerous", () => {
    const result = score({
      calls: { a1: "correct", a2: "correct", a3: "correct", a4: "incorrect", a5: "incorrect", a6: "incorrect" },
      mostDangerousPick: "a5",
    });
    expect(result.score).toBe(6); // 6 correct classifications, no critical bonus
    expect(result.criticalWasIdentified).toBe(false);
    expect(result.criticalWasMissed).toBe(true);
  });

  it("awards the critical bonus even when the critical option is misclassified as correct (plan.md Q6: unrestricted pick)", () => {
    const result = score({
      calls: { a1: "correct", a2: "correct", a3: "correct", a4: "correct", a5: "incorrect", a6: "incorrect" },
      mostDangerousPick: "a4",
    });
    // a4 misclassified (-1 from the 6 possible), but the critical bonus is independent and still awarded.
    expect(result.optionResults.find((r) => r.optionId === "a4")?.wasMisclassified).toBe(true);
    expect(result.criticalWasIdentified).toBe(true);
    expect(result.score).toBe(5 * PER_OPTION + CRITICAL_BONUS);
  });
});
