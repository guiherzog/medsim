export interface Vitals {
  pa: string;
  fc: number;
  spo2: number;
  fr: number;
}

export type VitalKey = keyof Vitals;

/** The consequence an authored choice (or an expired clock) produces. */
export interface Consequence {
  /** Narrated into the activity log as the patient's response. */
  feed: string;
  /** Vitals the monitor eases toward — authored, never random. */
  target: Vitals;
  /** Which reading the situation hinges on afterwards, if any. */
  criticalVital: VitalKey | null;
}

export interface DecisionOption extends Consequence {
  id: string;
  label: string;
  correct: boolean;
  /** The gravest wrong action for this step — at most one per step. */
  critical?: boolean;
  /** Shown in the debrief so the candidate learns why. */
  rationale: string;
  /** Placeholder title for a follow-up clip; no assets exist yet. */
  clip?: string;
  /** Next step id, or null to end the run. */
  next: string | null;
}

export interface CaseStep {
  id: string;
  /** The incoming situation, narrated when the step opens. */
  event: string;
  prompt: string;
  vitals: Vitals;
  criticalVital: VitalKey | null;
  /** Seconds to decide before the timeout consequence fires. */
  decisionSeconds: number;
  timeout: Consequence;
  options: DecisionOption[];
}

export interface CaseBriefing {
  patient: string;
  patientDetail: string;
  /** e.g. "~4 min · difícil · IAM de parede inferior" */
  meta: string;
  admissionVitals: Vitals;
  note: string;
}

export interface Scoring {
  pointsPerCorrectDecision: number;
  criticalErrorPenalty: number;
  timeoutPenalty: number;
}

export interface Approval {
  approvedBy?: string;
  approvedAt?: string;
}

export type CaseStatus = "disabled" | "draft" | "under_review" | "reviewed";

export interface CaseSpec {
  slug: string;
  title: string;
  category: string;
  disclaimer: string;
  approval?: Approval;
  briefing: CaseBriefing;
  steps: CaseStep[];
  scoring: Scoring;
}

/** One decision as submitted by the candidate and settled by the server. */
export interface RecordedDecision {
  stepId: string;
  /** null when the clock expired without a choice. */
  optionId: string | null;
  timedOut: boolean;
  /** Seconds into the run, for the debrief timeline. */
  at: number;
}

export interface DecisionResult {
  stepId: string;
  optionId: string | null;
  timedOut: boolean;
  correct: boolean;
  critical: boolean;
  points: number;
}

export interface RunScore {
  score: number;
  maxScore: number;
  correct: number;
  criticalErrors: number;
  timeouts: number;
  total: number;
  results: DecisionResult[];
}
