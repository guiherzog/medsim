// PROTOTYPE — throwaway. See PROTOTYPE_README.md.
import type { SimVitals, VitalKey } from "./prototypeCase";

export type Severity = "normal" | "warning" | "critical";

/** Adult reference bands, so a reading can be read on its own without a mental lookup. */
export const RANGES: Record<VitalKey, { label: string; unit: string; normal: string }> = {
  pa: { label: "PA", unit: "mmHg", normal: "90–140" },
  fc: { label: "FC", unit: "bpm", normal: "60–100" },
  spo2: { label: "SpO₂", unit: "%", normal: "≥ 95" },
  fr: { label: "FR", unit: "irpm", normal: "12–20" },
};

export function systolic(pa: string) {
  return Number(pa.split("/")[0]);
}

export function severityOf(key: VitalKey, v: SimVitals): Severity {
  if (key === "pa") {
    const s = systolic(v.pa);
    if (s < 80 || s > 180) return "critical";
    if (s < 90 || s > 140) return "warning";
    return "normal";
  }
  if (key === "fc") {
    if (v.fc === 0 || v.fc < 50 || v.fc > 130) return "critical";
    if (v.fc < 60 || v.fc > 100) return "warning";
    return "normal";
  }
  if (key === "spo2") {
    if (v.spo2 < 90) return "critical";
    if (v.spo2 < 95) return "warning";
    return "normal";
  }
  if (v.fr === 0 || v.fr > 24 || v.fr < 9) return "critical";
  if (v.fr > 20 || v.fr < 12) return "warning";
  return "normal";
}

export type PatientState = "stable" | "unstable" | "dying";

/**
 * "dying" is the desperate-mode trigger: cardiac arrest, or perfusion/oxygenation
 * that kills within minutes if nothing changes.
 */
export function patientStateOf(v: SimVitals): PatientState {
  if (v.fc === 0 || systolic(v.pa) < 70 || v.spo2 < 85) return "dying";
  const severities = (Object.keys(RANGES) as VitalKey[]).map((k) => severityOf(k, v));
  if (severities.includes("critical")) return "unstable";
  if (severities.includes("warning")) return "unstable";
  return "stable";
}

/** Signed change from the admission reading, for the "how far off" hint. */
export function deltaFrom(baseline: SimVitals, current: SimVitals, key: VitalKey) {
  const a = key === "pa" ? systolic(baseline.pa) : (baseline[key] as number);
  const b = key === "pa" ? systolic(current.pa) : (current[key] as number);
  const d = b - a;
  if (d === 0) return null;
  return `${d > 0 ? "+" : ""}${d}`;
}
