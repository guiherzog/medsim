import { describe, expect, it } from "vitest";
import { describeChange, driftVitals, easeToward, vitalChanges } from "../drift";
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

describe("vitalChanges", () => {
  const at = (over: Partial<Vitals>): Vitals => ({ ...NORMAL_VITALS, ...over });

  it("lists only what moved, with a signed delta", () => {
    const [change, ...rest] = vitalChanges(NORMAL_VITALS, at({ fc: 96 }));
    expect(rest).toHaveLength(0);
    expect(change).toMatchObject({ key: "fc", label: "FC", delta: 22 });
  });

  it("judges blood pressure on its systolic value", () => {
    const [change] = vitalChanges(at({ pa: "120/80" }), at({ pa: "90/60" }));
    expect(change.delta).toBe(-30);
  });

  it("calls a move toward the normal band better, whichever way it goes", () => {
    // Climbing out of arrest is good even though the number rises.
    expect(vitalChanges(at({ fc: 0 }), at({ fc: 96 }))[0].direction).toBe("better");
    // Pressure recovering from shock is good.
    expect(vitalChanges(at({ pa: "72/40" }), at({ pa: "104/64" }))[0].direction).toBe("better");
    // Fever-driven tachypnoea settling is good even though the number falls.
    expect(vitalChanges(at({ fr: 28 }), at({ fr: 18 }))[0].direction).toBe("better");
  });

  it("calls a move away from the normal band worse, whichever way it goes", () => {
    // A rising heart rate is bad once it runs past normal.
    expect(vitalChanges(at({ fc: 96 }), at({ fc: 130 }))[0].direction).toBe("worse");
    expect(vitalChanges(at({ pa: "104/64" }), at({ pa: "58/32" }))[0].direction).toBe("worse");
    expect(vitalChanges(at({ spo2: 96 }), at({ spo2: 86 }))[0].direction).toBe("worse");
  });

  it("is neutral when a reading moves but stays equally normal", () => {
    // Both 74 and 80 sit inside 60–100, so neither is closer to the band.
    expect(vitalChanges(at({ fc: 74 }), at({ fc: 80 }))[0].direction).toBe("neutral");
  });

  it("counts arriving inside the band as better", () => {
    expect(vitalChanges(at({ fc: 40 }), at({ fc: 80 }))[0].direction).toBe("better");
  });
});
