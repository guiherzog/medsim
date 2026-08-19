import { describe, expect, it } from "vitest";
import { describeChange, driftVitals, easeToward } from "../drift";
import { NORMAL_VITALS } from "./fixtures";
import type { Vitals } from "../types";

describe("easeToward", () => {
  it("closes a quarter of the gap, at least one unit", () => {
    expect(easeToward(100, 200)).toBe(125);
    expect(easeToward(100, 102)).toBe(101);
  });

  it("lands exactly on the target rather than overshooting", () => {
    expect(easeToward(100, 101)).toBe(101);
    expect(easeToward(100, 100)).toBe(100);
  });

  it("works downward as well as upward", () => {
    expect(easeToward(200, 100)).toBe(175);
  });

  it("always converges, never oscillates", () => {
    let n = 58;
    for (let i = 0; i < 50; i++) n = easeToward(n, 0);
    expect(n).toBe(0);
  });
});

describe("driftVitals", () => {
  const target: Vitals = { pa: "60/30", fc: 40, spo2: 80, fr: 30 };

  it("is deterministic — same inputs, same output", () => {
    expect(driftVitals(NORMAL_VITALS, target)).toEqual(driftVitals(NORMAL_VITALS, target));
  });

  it("eventually reaches the target and then stays there", () => {
    let v = NORMAL_VITALS;
    for (let i = 0; i < 100; i++) v = driftVitals(v, target);
    expect(v).toEqual(target);
    expect(driftVitals(v, target)).toEqual(target);
  });

  it("moves both halves of the blood pressure", () => {
    const next = driftVitals({ ...NORMAL_VITALS, pa: "120/80" }, { ...target, pa: "80/40" });
    expect(next.pa).toBe("110/70");
  });
});

describe("describeChange", () => {
  it("lists only what actually changed", () => {
    expect(describeChange(NORMAL_VITALS, { ...NORMAL_VITALS, fc: 96 })).toBe("FC 74 → 96");
  });

  it("is empty when nothing moved", () => {
    expect(describeChange(NORMAL_VITALS, NORMAL_VITALS)).toBe("");
  });
});
