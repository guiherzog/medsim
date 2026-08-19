import type { Evolution, EvolutionScore, OptionResult, UserSelections } from "./types";

/**
 * Compares the candidate's correct/incorrect call and most-dangerous pick
 * against an evolution's answer key. The most-dangerous pick is unrestricted
 * (plan.md Q6) — it can be any of the 6 options, including one the candidate
 * just called "correct" — so the two scoring components below are computed
 * independently and never need special-case handling for that contradiction.
 * Pure function, no I/O.
 */
export function scoreEvolution(evolution: Evolution, selections: UserSelections, perOptionPoints: number, criticalBonus: number): EvolutionScore {
  const optionResults: OptionResult[] = evolution.options.map((option) => {
    const correctCall = option.correct ? "correct" : "incorrect";
    const userCall = selections.calls[option.id];
    return {
      optionId: option.id,
      userCall,
      correctCall,
      wasMisclassified: userCall !== correctCall,
    };
  });

  const classificationScore = optionResults.filter((r) => !r.wasMisclassified).length * perOptionPoints;

  const criticalOption = evolution.options.find((o) => o.critical) ?? null;
  const criticalWasIdentified = criticalOption !== null && selections.mostDangerousPick === criticalOption.id;
  const criticalWasMissed = criticalOption !== null && !criticalWasIdentified;

  const score = classificationScore + (criticalWasIdentified ? criticalBonus : 0);
  const maxScore = evolution.options.length * perOptionPoints + criticalBonus;

  return {
    evolutionId: evolution.id,
    score,
    maxScore,
    optionResults,
    criticalOptionId: criticalOption?.id ?? null,
    criticalWasIdentified,
    criticalWasMissed,
  };
}
