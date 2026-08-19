import type { SupabaseClient } from "@supabase/supabase-js";
import { scoreRun } from "@/lib/engine/scoreRun";
import type { CaseSpec, RecordedDecision, RunScore } from "@/lib/engine/types";

export interface AttemptRow {
  id: string;
  caseId: string;
  userId: string;
  status: "in_progress" | "completed";
  currentStepId: string | null;
  decisions: RecordedDecision[];
  finalScore: number | null;
  maxPossibleScore: number | null;
}

interface AttemptDbRow {
  id: string;
  case_id: string;
  user_id: string;
  status: "in_progress" | "completed";
  current_evolution_id: string | null;
  decisions: RecordedDecision[] | null;
  final_score: number | null;
  max_possible_score: number | null;
}

function mapRow(row: AttemptDbRow): AttemptRow {
  return {
    id: row.id,
    caseId: row.case_id,
    userId: row.user_id,
    status: row.status,
    // current_evolution_id predates Phase 2; it now holds the current step id.
    currentStepId: row.current_evolution_id,
    decisions: row.decisions ?? [],
    finalScore: row.final_score,
    maxPossibleScore: row.max_possible_score,
  };
}

export async function createAttempt(
  supabase: SupabaseClient,
  { caseId, userId, firstStepId }: { caseId: string; userId: string; firstStepId: string },
): Promise<AttemptRow> {
  const { data, error } = await supabase
    .from("case_attempts")
    .insert({
      case_id: caseId,
      user_id: userId,
      current_evolution_id: firstStepId,
      decisions: [],
    })
    .select()
    .single();

  if (error) throw new Error(`createAttempt failed: ${error.message}`);
  return mapRow(data);
}

export async function getAttempt(
  supabase: SupabaseClient,
  attemptId: string,
): Promise<AttemptRow | null> {
  const { data, error } = await supabase
    .from("case_attempts")
    .select()
    .eq("id", attemptId)
    .maybeSingle();
  if (error) throw new Error(`getAttempt failed: ${error.message}`);
  return data ? mapRow(data) : null;
}

/**
 * Records one decision and rescores the whole run from the server's own copy of
 * the case spec. The client is never trusted for correctness — it may have seen
 * the answer key (accepted trade for latency, see plan.md Phase 2), but the
 * score is always recomputed here.
 */
export async function recordDecision(
  supabase: SupabaseClient,
  {
    attempt,
    caseSpec,
    stepId,
    optionId,
    timedOut,
    at,
  }: {
    attempt: AttemptRow;
    caseSpec: CaseSpec;
    stepId: string;
    optionId: string | null;
    timedOut: boolean;
    at: number;
  },
): Promise<{ score: RunScore; isComplete: boolean; nextStepId: string | null }> {
  const step = caseSpec.steps.find((s) => s.id === stepId);
  if (!step) throw new Error(`unknown step ${stepId} for case ${caseSpec.slug}`);
  if (attempt.currentStepId !== stepId) {
    throw new Error(`step ${stepId} is not the attempt's current step`);
  }
  if (attempt.decisions.some((d) => d.stepId === stepId)) {
    throw new Error(`step ${stepId} already decided`);
  }

  const chosen = timedOut ? null : (step.options.find((o) => o.id === optionId) ?? null);
  if (!timedOut && !chosen) throw new Error(`unknown option ${optionId} for step ${stepId}`);

  const decisions = [
    ...attempt.decisions,
    { stepId, optionId: chosen?.id ?? null, timedOut: timedOut || !chosen, at },
  ];
  const score = scoreRun(caseSpec, decisions);

  // A timeout follows the same path the step's first option leads to, so a run
  // can't stall just because the clock ran out.
  const nextStepId = chosen ? chosen.next : step.options[0].next;
  const isComplete = nextStepId === null;

  const { error } = await supabase
    .from("case_attempts")
    .update({
      decisions,
      current_evolution_id: nextStepId,
      status: isComplete ? "completed" : "in_progress",
      final_score: score.score,
      max_possible_score: score.maxScore,
      ended_at: isComplete ? new Date().toISOString() : null,
    })
    .eq("id", attempt.id);

  if (error) throw new Error(`recordDecision failed: ${error.message}`);
  return { score, isComplete, nextStepId };
}
