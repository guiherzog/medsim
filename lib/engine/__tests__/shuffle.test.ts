import { describe, expect, it } from "vitest";
import { shuffleOptions } from "../shuffle";
import { fixtureEvolution } from "./fixtures";

describe("shuffleOptions", () => {
  it("is deterministic for the same attemptId + evolutionId", () => {
    const first = shuffleOptions(fixtureEvolution, "attempt-1");
    const second = shuffleOptions(fixtureEvolution, "attempt-1");
    expect(first.map((o) => o.id)).toEqual(second.map((o) => o.id));
  });

  it("produces a different order for a different attemptId", () => {
    const a = shuffleOptions(fixtureEvolution, "attempt-1");
    const b = shuffleOptions(fixtureEvolution, "attempt-2");
    expect(a.map((o) => o.id)).not.toEqual(b.map((o) => o.id));
  });

  it("never drops or duplicates an option", () => {
    const shuffled = shuffleOptions(fixtureEvolution, "attempt-3");
    expect(shuffled.map((o) => o.id).sort()).toEqual(
      fixtureEvolution.options.map((o) => o.id).sort(),
    );
  });
});
