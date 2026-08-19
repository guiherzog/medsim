// PROTOTYPE — throwaway. See PROTOTYPE_README.md.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FIRST_STEP_ID,
  stepById,
  type SimOption,
  type SimStep,
  type SimVitals,
  type VitalKey,
} from "./prototypeCase";

export interface FeedEntry {
  id: number;
  /** "vitals" entries make the monitor's movement explicit in the log. */
  kind: "event" | "decision" | "outcome" | "vitals" | "clip";
  text: string;
  tone?: "good" | "bad" | "critical";
  at: number;
}

export type Trend = "up" | "down" | "flat";

function parsePa(pa: string) {
  const [s, d] = pa.split("/").map(Number);
  return { s, d };
}

/** Ease toward a target — the "live" drift, fully deterministic. */
function ease(current: number, target: number) {
  if (current === target) return target;
  const delta = target - current;
  const step = Math.sign(delta) * Math.max(1, Math.round(Math.abs(delta) * 0.25));
  return Math.abs(delta) <= Math.abs(step) ? target : current + step;
}

function driftVitals(current: SimVitals, target: SimVitals): SimVitals {
  const c = parsePa(current.pa);
  const t = parsePa(target.pa);
  return {
    pa: `${ease(c.s, t.s)}/${ease(c.d, t.d)}`,
    fc: ease(current.fc, target.fc),
    spo2: ease(current.spo2, target.spo2),
    fr: ease(current.fr, target.fr),
  };
}

const LABELS: Record<VitalKey, string> = { pa: "PA", fc: "FC", spo2: "SpO₂", fr: "FR" };

/** "PA 72/40 → 104/64 · FC 58 → 72" — states the authored change outright. */
function describeChange(from: SimVitals, to: SimVitals) {
  return (Object.keys(LABELS) as VitalKey[])
    .filter((k) => String(from[k]) !== String(to[k]))
    .map((k) => `${LABELS[k]} ${from[k]} → ${to[k]}`)
    .join(" · ");
}

function trendOf(prev: SimVitals, next: SimVitals, key: VitalKey): Trend {
  const a = key === "pa" ? parsePa(prev.pa).s : (prev[key] as number);
  const b = key === "pa" ? parsePa(next.pa).s : (next[key] as number);
  if (b > a) return "up";
  if (b < a) return "down";
  return "flat";
}

export interface SimScore {
  correct: number;
  criticalErrors: number;
  total: number;
}

export function useSimEngine() {
  const first = stepById(FIRST_STEP_ID);
  const [step, setStep] = useState<SimStep>(first);
  const [vitals, setVitals] = useState<SimVitals>(first.vitals);
  const [target, setTarget] = useState<SimVitals>(first.vitals);
  const [trends, setTrends] = useState<Record<VitalKey, Trend>>({
    pa: "flat",
    fc: "flat",
    spo2: "flat",
    fr: "flat",
  });
  const [criticalVital, setCriticalVital] = useState<VitalKey | null>(first.criticalVital);
  const [elapsed, setElapsed] = useState(0);
  const [awaitingDecision, setAwaitingDecision] = useState(true);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState<SimScore>({ correct: 0, criticalErrors: 0, total: 0 });
  const [clips, setClips] = useState<string[]>([]);
  const nextId = useRef(1);
  const [feed, setFeed] = useState<FeedEntry[]>([
    { id: 0, kind: "event", text: first.event, at: 0 },
  ]);

  const push = useCallback((entry: Omit<FeedEntry, "id" | "at">, at: number) => {
    setFeed((f) => [...f, { ...entry, id: nextId.current++, at }]);
  }, []);

  // One tick drives the clock, the drift, and the trend arrows.
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed((e) => e + 1);
      setVitals((v) => {
        const next = driftVitals(v, target);
        setTrends({
          pa: trendOf(v, next, "pa"),
          fc: trendOf(v, next, "fc"),
          spo2: trendOf(v, next, "spo2"),
          fr: trendOf(v, next, "fr"),
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  const choose = useCallback(
    (option: SimOption) => {
      if (!awaitingDecision) return;
      setAwaitingDecision(false);

      push({ kind: "decision", text: option.label, tone: option.correct ? "good" : "bad" }, elapsed);
      push(
        {
          kind: "outcome",
          text: option.feed,
          tone: option.critical ? "critical" : option.correct ? "good" : "bad",
        },
        elapsed,
      );

      const change = describeChange(vitals, option.target);
      if (change) {
        push(
          { kind: "vitals", text: change, tone: option.correct ? "good" : "critical" },
          elapsed,
        );
      }
      if (option.clip) {
        push({ kind: "clip", text: option.clip }, elapsed);
        setClips((c) => [...c, option.clip!]);
      }

      setTarget(option.target);
      setCriticalVital(option.criticalVital);
      setScore((s) => ({
        correct: s.correct + (option.correct ? 1 : 0),
        criticalErrors: s.criticalErrors + (option.critical ? 1 : 0),
        total: s.total + 1,
      }));

      const nextStepId = option.next;
      window.setTimeout(() => {
        if (!nextStepId) {
          setFinished(true);
          return;
        }
        const nextStep = stepById(nextStepId);
        setStep(nextStep);
        setTarget(nextStep.vitals);
        setCriticalVital(nextStep.criticalVital);
        setFeed((f) => [
          ...f,
          { id: nextId.current++, kind: "event", text: nextStep.event, at: elapsed },
        ]);
        setAwaitingDecision(true);
      }, 2800);
    },
    [awaitingDecision, elapsed, push, vitals],
  );

  return {
    step,
    vitals,
    trends,
    criticalVital,
    elapsed,
    feed,
    awaitingDecision,
    finished,
    score,
    clips,
    choose,
  };
}

export function formatClock(seconds: number) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}
