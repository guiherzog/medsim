import { describe, expect, it } from "vitest";
import { scoreRun } from "../scoreRun";
import type { RecordedDecision } from "../types";
import { fixtureCase } from "./fixtures";

const pick = (stepId: string, optionId: string, at = 0): RecordedDecision => ({
  stepId,
  optionId,
  timedOut: false,
  at,
});
const expire = (stepId: string, at = 0): RecordedDecision => ({
  stepId,
  optionId: null,
  timedOut: true,
  at,
});

describe("scoreRun", () => {
  it("awards full marks when every decision is correct", () => {
    const r = scoreRun(fixtureCase, [pick("s1", "s1a"), pick("s2", "s2a")]);
    expect(r.score).toBe(20);
    expect(r.maxScore).toBe(20);
    expect(r.correct).toBe(2);
    expect(r.criticalErrors).toBe(0);
    expect(r.timeouts).toBe(0);
  });

  it("subtracts the penalty for a critical error", () => {
    const r = scoreRun(fixtureCase, [pick("s1", "s1b"), pick("s2", "s2a")]);
    // 0 for the critical error, -5 penalty, +10 for the correct second call.
    expect(r.score).toBe(5);
    expect(r.criticalErrors).toBe(1);
  });

  it("scores a merely wrong (non-critical) decision at zero, without a penalty", () => {
    const r = scoreRun(fixtureCase, [pick("s1", "s1c"), pick("s2", "s2a")]);
    expect(r.score).toBe(10);
    expect(r.criticalErrors).toBe(0);
  });

  it("penalises an expired clock and counts it as a timeout, not a wrong answer", () => {
    const r = scoreRun(fixtureCase, [expire("s1"), pick("s2", "s2a")]);
    expect(r.score).toBe(5);
    expect(r.timeouts).toBe(1);
    expect(r.correct).toBe(1);
    expect(r.results[0]).toMatchObject({ timedOut: true, correct: false, critical: false });
  });

  it("floors the score at zero rather than going negative", () => {
    const r = scoreRun(fixtureCase, [pick("s1", "s1b"), expire("s2")]);
    // -5 critical, -5 timeout = -10 raw.
    expect(r.score).toBe(0);
    expect(r.maxScore).toBe(20);
  });

  it("treats an unknown option id as a timeout rather than trusting the client", () => {
    const r = scoreRun(fixtureCase, [
      { stepId: "s1", optionId: "not-a-real-option", timedOut: false, at: 3 },
    ]);
    expect(r.results[0].timedOut).toBe(true);
    expect(r.score).toBe(0);
  });

  it("scores a partial run against the case's full maxScore", () => {
    const r = scoreRun(fixtureCase, [pick("s1", "s1a")]);
    expect(r.score).toBe(10);
    expect(r.maxScore).toBe(20);
    expect(r.total).toBe(1);
  });
});
