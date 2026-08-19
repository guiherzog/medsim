"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { describeChange, driftVitals } from "@/lib/engine/drift";
import { ALARM_RULES, patientStateOf } from "@/lib/engine/vitalStatus";
import type {
  CaseSpec,
  CaseStep,
  Consequence,
  DecisionOption,
  Vitals,
  VitalKey,
} from "@/lib/engine/types";

export type LogKind =
  | "event"
  | "decision"
  | "outcome"
  | "vitals"
  | "alarm"
  | "timeout"
  | "clip";

export interface LogItem {
  id: number;
  kind: LogKind;
  text: string
  tone?: "good" | "bad" | "critical";
  at: number;
}

export type Trend = "up" | "down" | "flat";

const FLAT: Record<VitalKey, Trend> = { pa: "flat", fc: "flat", spo2: "flat", fr: "flat" };

function trendOf(prev: Vitals, next: Vitals, key: VitalKey): Trend {
  const read = (v: Vitals) => (key === "pa" ? Number(v.pa.split("/")[0]) : (v[key] as number));
  const a = read(prev);
  const b = read(next);
  return b > a ? "up" : b < a ? "down" : "flat";
}

/** How long a consequence is allowed to land before the next situation arrives. */
const SETTLE_MS = 2800;

/**
 * Drives one run in the browser: a single one-second tick advances the elapsed
 * clock, eases the vitals toward the current authored target, trips alarms, and
 * counts down the decision clock. Every decision is POSTed so the server can
 * rescore authoritatively — this hook's own tallies are for display only.
 *
 * The tick deliberately owns all four jobs. An earlier prototype split the
 * decision countdown into its own effect whose deps changed every second, which
 * tore the interval down before it could fire and stalled the clock.
 */
export function useRun({ caseSpec, attemptId }: { caseSpec: CaseSpec; attemptId: string }) {
  const first = caseSpec.steps[0];
  const [step, setStep] = useState<CaseStep>(first);
  const [vitals, setVitals] = useState<Vitals>(first.vitals);
  const [target, setTarget] = useState<Vitals>(first.vitals);
  const [trends, setTrends] = useState<Record<VitalKey, Trend>>(FLAT);
  const [criticalVital, setCriticalVital] = useState<VitalKey | null>(first.criticalVital);
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(first.decisionSeconds);
  const [awaitingDecision, setAwaitingDecision] = useState(true);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<LogItem[]>([
    { id: 0, kind: "event", text: first.event, at: 0 },
  ]);

  const nextId = useRef(1);
  const elapsedRef = useRef(0);
  elapsedRef.current = elapsed;
  const awaitingRef = useRef(true);
  awaitingRef.current = awaitingDecision;
  const stepRef = useRef(first);
  stepRef.current = step;
  const vitalsRef = useRef(first.vitals);
  vitalsRef.current = vitals;
  const firedAlarms = useRef<Set<string>>(new Set());
  const settledStep = useRef<string | null>(null);

  const push = useCallback((item: Omit<LogItem, "id" | "at">, at: number) => {
    setLog((l) => [...l, { ...item, id: nextId.current++, at }]);
  }, []);

  // The one clock: elapsed, drift, alarms, decision countdown.
  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => {
      setElapsed((e) => e + 1);
      if (awaitingRef.current) setRemaining((r) => Math.max(0, r - 1));
      setVitals((v) => {
        const next = driftVitals(v, target);
        setTrends({
          pa: trendOf(v, next, "pa"),
          fc: trendOf(v, next, "fc"),
          spo2: trendOf(v, next, "spo2"),
          fr: trendOf(v, next, "fr"),
        });
        for (const rule of ALARM_RULES) {
          if (rule.test(next)) {
            if (!firedAlarms.current.has(rule.id)) {
              firedAlarms.current.add(rule.id);
              setLog((l) => [
                ...l,
                { id: nextId.current++, kind: "alarm", text: rule.text, at: elapsedRef.current },
              ]);
            }
          } else {
            firedAlarms.current.delete(rule.id);
          }
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [target, finished]);

  const applyConsequence = useCallback(
    (consequence: Consequence, at: number, tone: LogItem["tone"]) => {
      push({ kind: "outcome", text: consequence.feed, tone }, at);
      const change = describeChange(vitalsRef.current, consequence.target);
      if (change) push({ kind: "vitals", text: change, tone }, at);
      setTarget(consequence.target);
      setCriticalVital(consequence.criticalVital);
    },
    [push],
  );

  const settle = useCallback(
    (nextStepId: string | null, at: number) => {
      const from = stepRef.current.id;
      if (settledStep.current === from) return;
      settledStep.current = from;

      window.setTimeout(() => {
        if (nextStepId === null) {
          setFinished(true);
          return;
        }
        const next = caseSpec.steps.find((s) => s.id === nextStepId);
        if (!next) {
          setFinished(true);
          return;
        }
        setStep(next);
        setTarget(next.vitals);
        setCriticalVital(next.criticalVital);
        setRemaining(next.decisionSeconds);
        setLog((l) => [...l, { id: nextId.current++, kind: "event", text: next.event, at }]);
        setAwaitingDecision(true);
      }, SETTLE_MS);
    },
    [caseSpec.steps],
  );

  const submit = useCallback(
    async (stepId: string, optionId: string | null, timedOut: boolean, at: number) => {
      try {
        const res = await fetch(`/api/attempts/${attemptId}/decisions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stepId, optionId, timedOut, at }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "failed to record decision");
        }
        return (await res.json()) as { nextStepId: string | null };
      } catch (err) {
        setError((err as Error).message);
        return null;
      }
    },
    [attemptId],
  );

  const choose = useCallback(
    async (option: DecisionOption) => {
      if (!awaitingRef.current) return;
      setAwaitingDecision(false);
      const at = elapsedRef.current;
      const current = stepRef.current;

      push({ kind: "decision", text: option.label, tone: option.correct ? "good" : "bad" }, at);
      applyConsequence(option, at, option.critical ? "critical" : option.correct ? "good" : "bad");
      if (option.clip) push({ kind: "clip", text: option.clip }, at);

      const result = await submit(current.id, option.id, false, at);
      settle(result ? result.nextStepId : option.next, at);
    },
    [applyConsequence, push, settle, submit],
  );

  // Running out of time is a consequence, not a free pass. Guarded per step so
  // it fires once rather than on every re-render.
  const timedOutStep = useRef<string | null>(null);
  useEffect(() => {
    if (!awaitingDecision || finished || remaining > 0) return;
    const current = stepRef.current;
    if (timedOutStep.current === current.id) return;
    timedOutStep.current = current.id;

    setAwaitingDecision(false);
    const at = elapsedRef.current;
    push({ kind: "timeout", text: current.timeout.feed, tone: "bad" }, at);
    applyConsequence(current.timeout, at, "critical");

    void submit(current.id, null, true, at).then((result) => {
      settle(result ? result.nextStepId : current.options[0].next, at);
    });
  }, [awaitingDecision, finished, remaining, applyConsequence, push, settle, submit]);

  return {
    step,
    vitals,
    trends,
    criticalVital,
    patientState: patientStateOf(vitals),
    elapsed,
    remaining,
    log,
    awaitingDecision,
    finished,
    error,
    choose,
  };
}

export { formatClock } from "@/lib/format";
