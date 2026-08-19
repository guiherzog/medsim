import type { Vitals, VitalKey } from "./types";

export type Severity = "normal" | "warning" | "critical";
export type PatientState = "stable" | "unstable" | "dying";

/** Adult reference bands, so a reading can be judged without a mental lookup. */
export const RANGES: Record<VitalKey, { label: string; unit: string; normal: string }> = {
  pa: { label: "PA", unit: "mmHg", normal: "90–140" },
  fc: { label: "FC", unit: "bpm", normal: "60–100" },
  spo2: { label: "SpO₂", unit: "%", normal: "≥ 95" },
  fr: { label: "FR", unit: "irpm", normal: "12–20" },
};

export function systolic(pa: string) {
  return Number(pa.split("/")[0]);
}

export function severityOf(key: VitalKey, v: Vitals): Severity {
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

/** `dying` drives the whole-screen escalation: arrest, or perfusion/oxygenation that kills in minutes. */
export function patientStateOf(v: Vitals): PatientState {
  if (v.fc === 0 || systolic(v.pa) < 70 || v.spo2 < 85) return "dying";
  const keys = Object.keys(RANGES) as VitalKey[];
  return keys.some((k) => severityOf(k, v) !== "normal") ? "unstable" : "stable";
}

/** Signed change from the admission reading, for the "how far off" hint. */
export function deltaFrom(baseline: Vitals, current: Vitals, key: VitalKey): string | null {
  const a = key === "pa" ? systolic(baseline.pa) : (baseline[key] as number);
  const b = key === "pa" ? systolic(current.pa) : (current[key] as number);
  const d = b - a;
  return d === 0 ? null : `${d > 0 ? "+" : ""}${d}`;
}

/** Thresholds that trip a one-shot alarm — the monitor shouts on its own. */
export const ALARM_RULES: { id: string; test: (v: Vitals) => boolean; text: string }[] = [
  { id: "pa-low", test: (v) => systolic(v.pa) > 0 && systolic(v.pa) < 70, text: "PA sistólica < 70 — hipoperfusão grave" },
  { id: "arrest", test: (v) => v.fc === 0, text: "Sem ritmo detectável — parada" },
  { id: "spo2-low", test: (v) => v.spo2 > 0 && v.spo2 < 88, text: "SpO₂ < 88% — hipoxemia crítica" },
];
