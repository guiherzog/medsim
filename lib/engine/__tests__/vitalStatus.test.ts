import { describe, expect, it } from "vitest";
import { deltaFrom, patientStateOf, severityOf, ALARM_RULES } from "../vitalStatus";
import type { Vitals } from "../types";
import { NORMAL_VITALS } from "./fixtures";

const v = (over: Partial<Vitals> = {}): Vitals => ({ ...NORMAL_VITALS, ...over });

describe("severityOf", () => {
  it("reads a healthy set as normal across the board", () => {
    for (const key of ["pa", "fc", "spo2", "fr"] as const) {
      expect(severityOf(key, NORMAL_VITALS)).toBe("normal");
    }
  });

  it("grades blood pressure by systolic band", () => {
    expect(severityOf("pa", v({ pa: "85/50" }))).toBe("warning");
    expect(severityOf("pa", v({ pa: "72/40" }))).toBe("critical");
    expect(severityOf("pa", v({ pa: "190/100" }))).toBe("critical");
  });

  it("treats a rate of zero as critical, not merely low", () => {
    expect(severityOf("fc", v({ fc: 0 }))).toBe("critical");
    expect(severityOf("fr", v({ fr: 0 }))).toBe("critical");
  });

  it("grades oxygenation", () => {
    expect(severityOf("spo2", v({ spo2: 93 }))).toBe("warning");
    expect(severityOf("spo2", v({ spo2: 88 }))).toBe("critical");
  });
});

describe("patientStateOf", () => {
  it("is stable only when every reading is normal", () => {
    expect(patientStateOf(NORMAL_VITALS)).toBe("stable");
  });

  it("is unstable when something is off but not immediately lethal", () => {
    expect(patientStateOf(v({ spo2: 93 }))).toBe("unstable");
    expect(patientStateOf(v({ pa: "85/55" }))).toBe("unstable");
  });

  it("is dying on arrest, profound hypotension, or severe hypoxaemia", () => {
    expect(patientStateOf(v({ fc: 0 }))).toBe("dying");
    expect(patientStateOf(v({ pa: "64/38" }))).toBe("dying");
    expect(patientStateOf(v({ spo2: 82 }))).toBe("dying");
  });

  it("does not call a merely low pressure dying", () => {
    expect(patientStateOf(v({ pa: "72/40" }))).toBe("unstable");
  });
});

describe("deltaFrom", () => {
  it("reports a signed change and nothing when unchanged", () => {
    expect(deltaFrom(NORMAL_VITALS, v({ fc: 96 }), "fc")).toBe("+22");
    expect(deltaFrom(NORMAL_VITALS, v({ pa: "72/40" }), "pa")).toBe("-48");
    expect(deltaFrom(NORMAL_VITALS, NORMAL_VITALS, "spo2")).toBeNull();
  });
});

describe("ALARM_RULES", () => {
  it("stay silent on a healthy patient", () => {
    expect(ALARM_RULES.filter((r) => r.test(NORMAL_VITALS))).toHaveLength(0);
  });

  it("fire on arrest and on profound hypotension", () => {
    expect(ALARM_RULES.find((r) => r.id === "arrest")!.test(v({ fc: 0 }))).toBe(true);
    expect(ALARM_RULES.find((r) => r.id === "pa-low")!.test(v({ pa: "62/36" }))).toBe(true);
  });

  it("do not fire the hypotension alarm on a flatlined pressure (arrest covers it)", () => {
    expect(ALARM_RULES.find((r) => r.id === "pa-low")!.test(v({ pa: "0/0" }))).toBe(false);
  });
});
