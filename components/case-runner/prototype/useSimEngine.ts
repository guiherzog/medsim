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

/** Each kind renders with its own identity — see LogEntry.tsx. */
export type FeedKind =
  | "event"
  | "decision"
  | "outcome"
  | "vitals"
  | "alarm"
  | "timeout"
  | "clip";

export interface FeedEntry {
  id: number;
  kind: FeedKind;
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
  timeouts: number;
  total: number;
}

/** Thresholds that trip an automatic alarm entry — pressure the app applies itself. */
const ALARM_RULES: { key: VitalKey; test: (v: SimVitals) => boolean; text: string }[] = [
  { key: "pa", test: (v) => parsePa(v.pa).s > 0 && parsePa(v.pa).s < 70, text: "PA sistólica < 70 — hipoperfusão grave" },
  { key: "fc", test: (v) => v.fc === 0, text: "Sem ritmo detectável — parada" },
  { key: "spo2", test: (v) => v.spo2 > 0 && v.spo2 < 88, text: "SpO₂ < 88% — hipoxemia crítica" },
];

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
  const [score, setScore] = useState<SimScore>({
    correct: 0,
    criticalErrors: 0,
    timeouts: 0,
    total: 0,
  });
  /** Seconds left to decide on the current step — the pressure. */
  const [remaining, setRemaining] = useState(first.decisionSeconds);
  const firedAlarms = useRef<Set<string>>(new Set());
  /** Guards the timeout so it fires once per step, not once per re-render. */
  const timedOutStep = useRef<string | null>(null);
  const [clips, setClips] = useState<string[]>([]);
  const nextId = useRef(1);
  const [feed, setFeed] = useState<FeedEntry[]>([
    { id: 0, kind: "event", text: first.event, at: 0 },
  ]);

  // The tick closure needs the current elapsed value without re-subscribing.
  const elapsedRef = useRef(0);
  elapsedRef.current = elapsed;
  const awaitingRef = useRef(true);
  awaitingRef.current = awaitingDecision;
  const stepRef = useRef(first);
  stepRef.current = step;
  const vitalsRef = useRef(first.vitals);
  vitalsRef.current = vitals;

  const push = useCallback((entry: Omit<FeedEntry, "id" | "at">, at: number) => {
    setFeed((f) => [...f, { ...entry, id: nextId.current++, at }]);
  }, []);

  // One tick drives the clock, the drift, and the trend arrows.
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed((e) => e + 1);
      // The decision clock rides the same tick — a separate interval whose deps
      // changed every second kept getting torn down before it could fire.
      if (awaitingRef.current) setRemaining((r) => Math.max(0, r - 1));
      setVitals((v) => {
        const next = driftVitals(v, target);
        setTrends({
          pa: trendOf(v, next, "pa"),
          fc: trendOf(v, next, "fc"),
          spo2: trendOf(v, next, "spo2"),
          fr: trendOf(v, next, "fr"),
        });
        // Automatic alarms: the monitor shouts on its own, once per crossing.
        for (const rule of ALARM_RULES) {
          const key = `${rule.key}:${rule.text}`;
          if (rule.test(next)) {
            if (!firedAlarms.current.has(key)) {
              firedAlarms.current.add(key);
              setFeed((f) => [
                ...f,
                { id: nextId.current++, kind: "alarm", text: rule.text, at: elapsedRef.current },
              ]);
            }
          } else {
            firedAlarms.current.delete(key);
          }
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  const advance = useCallback(
    (nextStepId: string | null, at: number) => {
      window.setTimeout(() => {
        if (!nextStepId) {
          setFinished(true);
          return;
        }
        const nextStep = stepById(nextStepId);
        setStep(nextStep);
        setTarget(nextStep.vitals);
        setCriticalVital(nextStep.criticalVital);
        setRemaining(nextStep.decisionSeconds);
        setFeed((f) => [
          ...f,
          { id: nextId.current++, kind: "event", text: nextStep.event, at },
        ]);
        setAwaitingDecision(true);
      }, 2800);
    },
    [],
  );

  /** Running out of time is itself a consequence, not a free pass. */
  useEffect(() => {
    if (!awaitingDecision || finished || remaining > 0) return;
    const current = stepRef.current;
    if (timedOutStep.current === current.id) return;
    timedOutStep.current = current.id;

    setAwaitingDecision(false);
    const at = elapsedRef.current;
    push({ kind: "timeout", text: current.timeout.feed, tone: "bad" }, at);
    const change = describeChange(vitalsRef.current, current.timeout.target);
    if (change) push({ kind: "vitals", text: change, tone: "critical" }, at);
    setTarget(current.timeout.target);
    setCriticalVital(current.timeout.criticalVital);
    setScore((sc) => ({ ...sc, timeouts: sc.timeouts + 1, total: sc.total + 1 }));
    advance(current.options[0].next, at);
  }, [awaitingDecision, finished, remaining, push, advance]);

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
        ...s,
        correct: s.correct + (option.correct ? 1 : 0),
        criticalErrors: s.criticalErrors + (option.critical ? 1 : 0),
        total: s.total + 1,
      }));

      advance(option.next, elapsed);
    },
    [awaitingDecision, elapsed, push, vitals, advance],
  );

  return {
    step,
    vitals,
    remaining,
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
