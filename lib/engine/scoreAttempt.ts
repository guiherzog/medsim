import type { AttemptScore, EvolutionScore } from "./types";

/** Aggregates every evolution's score into a case total. Pure function, no I/O. */
export function scoreAttempt(evolutionScores: EvolutionScore[]): AttemptScore {
  return {
    finalScore: evolutionScores.reduce((sum, e) => sum + e.score, 0),
    maxPossibleScore: evolutionScores.reduce((sum, e) => sum + e.maxScore, 0),
    evolutionScores,
    criticalMisses: evolutionScores.filter((e) => e.criticalWasMissed).map((e) => e.evolutionId),
  };
}
