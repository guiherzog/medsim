import { describe, expect, it } from "vitest";
import { scoreAttempt } from "../scoreAttempt";
import { scoreEvolution } from "../scoreEvolution";
import { fixtureEvolution } from "./fixtures";

describe("scoreAttempt", () => {
  it("sums evolution scores and collects critical misses", () => {
    const allCorrect = scoreEvolution(
      fixtureEvolution,
      { calls: { a1: "correct", a2: "correct", a3: "correct", a4: "incorrect", a5: "incorrect", a6: "incorrect" }, mostDangerousPick: "a4" },
      1,
      2,
    );
    const missedCritical = scoreEvolution(
      { ...fixtureEvolution, id: "1.B" },
      { calls: { a1: "correct", a2: "correct", a3: "correct", a4: "incorrect", a5: "incorrect", a6: "incorrect" }, mostDangerousPick: "a5" },
      1,
      2,
    );

    const attempt = scoreAttempt([allCorrect, missedCritical]);

    expect(attempt.finalScore).toBe(8 + 6);
    expect(attempt.maxPossibleScore).toBe(16);
    expect(attempt.criticalMisses).toEqual(["1.B"]);
  });
});
