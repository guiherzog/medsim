import type { Vitals, VitalKey } from "./types";
import { systolic } from "./vitalStatus";

function diastolic(pa: string) {
  return Number(pa.split("/")[1]);
}

/**
 * Eases one reading toward its target by a quarter of the remaining gap (at
 * least 1), so a change lands in a handful of ticks rather than snapping. Pure
 * and deterministic — no randomness anywhere, which is what keeps a given
 * sequence of decisions reproducible.
 */
export function easeToward(current: number, target: number): number {
  if (current === target) return target;
  const delta = target - current;
  const step = Math.sign(delta) * Math.max(1, Math.round(Math.abs(delta) * 0.25));
  return Math.abs(delta) <= Math.abs(step) ? target : current + step;
}

export function driftVitals(current: Vitals, target: Vitals): Vitals {
  return {
    pa: `${easeToward(systolic(current.pa), systolic(target.pa))}/${easeToward(
      diastolic(current.pa),
      diastolic(target.pa),
    )}`,
    fc: easeToward(current.fc, target.fc),
    spo2: easeToward(current.spo2, target.spo2),
    fr: easeToward(current.fr, target.fr),
  };
}

/** The band each reading is judged against — mirrors RANGES in vitalStatus. */
const NORMAL_BAND: Record<VitalKey, [number, number]> = {
  pa: [90, 140],
  fc: [60, 100],
  spo2: [95, 100],
  fr: [12, 20],
};

const LABELS: Record<VitalKey, string> = {
  pa: "PA",
  fc: "FC",
  spo2: "SpO₂",
  fr: "FR",
};

/** Blood pressure is judged on its systolic value; the rest are plain numbers. */
function numeric(key: VitalKey, v: Vitals): number {
  return key === "pa" ? systolic(v.pa) : (v[key] as number);
}

/** How far a reading sits outside its normal band; 0 when inside it. */
function distanceFromNormal(key: VitalKey, value: number): number {
  const [min, max] = NORMAL_BAND[key];
  if (value < min) return min - value;
  if (value > max) return value - max;
  return 0;
}

export type ChangeDirection = "better" | "worse" | "neutral";

export interface VitalChange {
  key: VitalKey;
  label: string;
  from: string | number;
  to: string | number;
  /** Signed change; for blood pressure this is the systolic delta. */
  delta: number;
  direction: ChangeDirection;
}

/**
 * Describes what moved, and whether each move helped.
 *
 * Direction is *not* the sign of the delta — a rising heart rate is good when
 * it climbs out of arrest and bad when it runs toward 130. What matters is
 * whether the reading moved toward its normal band or away from it.
 */
export function vitalChanges(from: Vitals, to: Vitals): VitalChange[] {
  return (Object.keys(LABELS) as VitalKey[])
    .filter((key) => String(from[key]) !== String(to[key]))
    .map((key) => {
      const a = numeric(key, from);
      const b = numeric(key, to);
      const before = distanceFromNormal(key, a);
      const after = distanceFromNormal(key, b);
      return {
        key,
        label: LABELS[key],
        from: from[key],
        to: to[key],
        delta: b - a,
        direction: after < before ? "better" : after > before ? "worse" : "neutral",
      };
    });
}

/** Plain-text form, for logs and tests that don't render markup. */
export function describeChange(from: Vitals, to: Vitals): string {
  return vitalChanges(from, to)
    .map((c) => `${c.label} ${c.from} → ${c.to}`)
    .join(" · ");
}
