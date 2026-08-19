export interface Vitals {
  pa: string | null;
  fc: number | null;
  spo2: number | null;
}

export interface Option {
  id: string;
  text: string;
  correct: boolean;
  critical?: boolean;
  rationale: string;
}

export interface Evolution {
  id: string;
  direction: "piora" | "melhora";
  narrative: string;
  vitals: Vitals;
  options: [Option, Option, Option, Option, Option, Option];
}

export interface BaseCase {
  narrative: string;
  vitals: Vitals;
  initialConductSeconds: number;
}

export interface Approval {
  approvedBy?: string;
  approvedAt?: string;
}

export interface Scoring {
  perOptionCorrectlyClassified: number;
  criticalIdentificationBonus: number;
  perEvolutionMax: number;
}

export type CaseStatus = "disabled" | "draft" | "under_review" | "reviewed";

export interface CaseSpec {
  slug: string;
  title: string;
  category: string;
  disclaimer: string;
  approval?: Approval;
  baseCase: BaseCase;
  evolutions: Evolution[];
  scoring: Scoring;
}

/** One option's correct/incorrect call, as submitted by the candidate. */
export type OptionCall = "correct" | "incorrect";

export interface UserSelections {
  /** The candidate's correct/incorrect call for every option id in the evolution. */
  calls: Record<string, OptionCall>;
  /** The single option id the candidate flagged as most dangerous. Unrestricted (plan.md Q6) — any of the 6, including ones called "correct". */
  mostDangerousPick: string;
}

export interface OptionResult {
  optionId: string;
  userCall: OptionCall;
  correctCall: OptionCall;
  wasMisclassified: boolean;
}

export interface EvolutionScore {
  evolutionId: string;
  score: number;
  maxScore: number;
  optionResults: OptionResult[];
  criticalOptionId: string | null;
  criticalWasIdentified: boolean;
  criticalWasMissed: boolean;
}

export interface AttemptScore {
  finalScore: number;
  maxPossibleScore: number;
  evolutionScores: EvolutionScore[];
  criticalMisses: string[];
}
