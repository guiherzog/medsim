import type { Vitals } from "./types";
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

/** Describes an authored change outright: "PA 72/40 → 104/64 · FC 58 → 72". */
export function describeChange(from: Vitals, to: Vitals): string {
  const labels: [keyof Vitals, string][] = [
    ["pa", "PA"],
    ["fc", "FC"],
    ["spo2", "SpO₂"],
    ["fr", "FR"],
  ];
  return labels
    .filter(([k]) => String(from[k]) !== String(to[k]))
    .map(([k, label]) => `${label} ${from[k]} → ${to[k]}`)
    .join(" · ");
}
