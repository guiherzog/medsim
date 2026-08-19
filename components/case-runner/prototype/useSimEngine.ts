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
  kind: "event" | "decision" | "outcome" | "clip";
  text: string;
  /** Set on decision/outcome entries so variants can colour them. */
  tone?: "good" | "bad" | "critical";
  at: number;
}

function parsePa(pa: string) {
  const [s, d] = pa.split("/").map((n) => Number(n));
  return { s, d };
}

/** Ease a number toward a target — the "live" drift, fully deterministic. */
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

/**
 * In-memory sim state machine. Vitals tick toward the current target once a
 * second, an elapsed clock runs, and each decision swaps the target and appends
 * to the feed. Nothing is persisted; reload starts over.
 */
export function useSimEngine() {
  const [step, setStep] = useState<SimStep>(() => stepById(FIRST_STEP_ID));
  const [vitals, setVitals] = useState<SimVitals>(() => stepById(FIRST_STEP_ID).vitals);
  const [target, setTarget] = useState<SimVitals>(() => stepById(FIRST_STEP_ID).vitals);
  const [criticalVital, setCriticalVital] = useState<VitalKey | null>(
    () => stepById(FIRST_STEP_ID).criticalVital,
  );
  const [elapsed, setElapsed] = useState(0);
  const [awaitingDecision, setAwaitingDecision] = useState(true);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState({ correct: 0, criticalErrors: 0, total: 0 });
  const nextFeedId = useRef(1);
  const [feed, setFeed] = useState<FeedEntry[]>(() => [
    { id: 0, kind: "event", text: stepById(FIRST_STEP_ID).event, at: 0 },
  ]);

  const push = useCallback((entry: Omit<FeedEntry, "id" | "at">, at: number) => {
    setFeed((f) => [...f, { ...entry, id: nextFeedId.current++, at }]);
  }, []);

  // Elapsed clock + vitals drift on one tick.
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed((e) => e + 1);
      setVitals((v) => driftVitals(v, target));
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
      if (option.clip) push({ kind: "clip", text: option.clip }, elapsed);

      setTarget(option.target);
      setCriticalVital(option.criticalVital);
      setScore((s) => ({
        correct: s.correct + (option.correct ? 1 : 0),
        criticalErrors: s.criticalErrors + (option.critical ? 1 : 0),
        total: s.total + 1,
      }));

      // Let the consequence land before the next situation arrives.
      const nextId = option.next;
      window.setTimeout(() => {
        if (!nextId) {
          setFinished(true);
          return;
        }
        const nextStep = stepById(nextId);
        setStep(nextStep);
        setTarget(nextStep.vitals);
        setCriticalVital(nextStep.criticalVital);
        setFeed((f) => [
          ...f,
          { id: nextFeedId.current++, kind: "event", text: nextStep.event, at: elapsed },
        ]);
        setAwaitingDecision(true);
      }, 2600);
    },
    [awaitingDecision, elapsed, push],
  );

  return { step, vitals, criticalVital, elapsed, feed, awaitingDecision, finished, score, choose };
}

export function formatClock(seconds: number) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}
