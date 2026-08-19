import type { CaseSpec, DecisionResult, RecordedDecision, RunScore } from "./types";

/**
 * Scores a completed (or partial) run from the case spec and the decisions
 * taken. Pure — no I/O — and always recomputed from the server's own copy of
 * the spec, so a client that has seen the answer key still can't forge a score.
 *
 * A correct decision earns `pointsPerCorrectDecision`; a critical error and an
 * expired clock each subtract their penalty. The total is floored at 0 so a bad
 * run reads as zero rather than negative.
 */
export function scoreRun(caseSpec: CaseSpec, decisions: RecordedDecision[]): RunScore {
  const { pointsPerCorrectDecision, criticalErrorPenalty, timeoutPenalty } = caseSpec.scoring;
  const stepById = new Map(caseSpec.steps.map((s) => [s.id, s]));

  const results: DecisionResult[] = decisions.map((d) => {
    const step = stepById.get(d.stepId);
    const option = step?.options.find((o) => o.id === d.optionId) ?? null;

    if (d.timedOut || !option) {
      return {
        stepId: d.stepId,
        optionId: null,
        timedOut: true,
        correct: false,
        critical: false,
        points: -timeoutPenalty,
      };
    }

    const critical = option.critical === true;
    return {
      stepId: d.stepId,
      optionId: option.id,
      timedOut: false,
      correct: option.correct,
      critical,
      points: option.correct ? pointsPerCorrectDecision : critical ? -criticalErrorPenalty : 0,
    };
  });

  const raw = results.reduce((sum, r) => sum + r.points, 0);

  return {
    score: Math.max(0, raw),
    maxScore: caseSpec.steps.length * pointsPerCorrectDecision,
    correct: results.filter((r) => r.correct).length,
    criticalErrors: results.filter((r) => r.critical).length,
    timeouts: results.filter((r) => r.timedOut).length,
    total: results.length,
    results,
  };
}
