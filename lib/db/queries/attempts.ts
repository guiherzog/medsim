import type { SupabaseClient } from "@supabase/supabase-js";
import { scoreAttempt } from "@/lib/engine/scoreAttempt";
import { scoreEvolution } from "@/lib/engine/scoreEvolution";
import type { AttemptScore, CaseSpec, EvolutionScore, UserSelections } from "@/lib/engine/types";

export interface AttemptRow {
  id: string;
  caseId: string;
  userId: string;
  status: "in_progress" | "completed";
  currentEvolutionId: string | null;
  initialConductText: string | null;
  evolutionResults: EvolutionScore[];
  finalScore: number | null;
  maxPossibleScore: number | null;
}

interface AttemptDbRow {
  id: string;
  case_id: string;
  user_id: string;
  status: "in_progress" | "completed";
  current_evolution_id: string | null;
  initial_conduct_text: string | null;
  evolution_results: EvolutionScore[] | null;
  final_score: number | null;
  max_possible_score: number | null;
}

function mapRow(row: AttemptDbRow): AttemptRow {
  return {
    id: row.id,
    caseId: row.case_id,
    userId: row.user_id,
    status: row.status,
    currentEvolutionId: row.current_evolution_id,
    initialConductText: row.initial_conduct_text,
    evolutionResults: (row.evolution_results ?? []) as EvolutionScore[],
    finalScore: row.final_score,
    maxPossibleScore: row.max_possible_score,
  };
}

export async function createAttempt(
  supabase: SupabaseClient,
  { caseId, userId, initialConductText, firstEvolutionId }: { caseId: string; userId: string; initialConductText: string; firstEvolutionId: string },
): Promise<AttemptRow> {
  const { data, error } = await supabase
    .from("case_attempts")
    .insert({
      case_id: caseId,
      user_id: userId,
      initial_conduct_text: initialConductText,
      current_evolution_id: firstEvolutionId,
      evolution_results: [],
    })
    .select()
    .single();

  if (error) throw new Error(`createAttempt failed: ${error.message}`);
  return mapRow(data);
}

export async function getAttempt(supabase: SupabaseClient, attemptId: string): Promise<AttemptRow | null> {
  const { data, error } = await supabase.from("case_attempts").select().eq("id", attemptId).maybeSingle();
  if (error) throw new Error(`getAttempt failed: ${error.message}`);
  return data ? mapRow(data) : null;
}

/**
 * Scores one evolution's submission, appends it to evolution_results, and
 * either advances current_evolution_id to the next evolution or marks the
 * attempt completed (final_score/max_possible_score set via scoreAttempt).
 */
export async function submitEvolution(
  supabase: SupabaseClient,
  { attempt, caseSpec, evolutionId, selections }: { attempt: AttemptRow; caseSpec: CaseSpec; evolutionId: string; selections: UserSelections },
): Promise<{ evolutionScore: EvolutionScore; isComplete: boolean; nextEvolutionId: string | null; attemptScore: AttemptScore | null }> {
  const evolution = caseSpec.evolutions.find((e) => e.id === evolutionId);
  if (!evolution) throw new Error(`unknown evolution ${evolutionId} for case ${caseSpec.slug}`);
  if (attempt.currentEvolutionId !== evolutionId) {
    throw new Error(`evolution ${evolutionId} is not the attempt's current evolution`);
  }

  const evolutionScore = scoreEvolution(
    evolution,
    selections,
    caseSpec.scoring.perOptionCorrectlyClassified,
    caseSpec.scoring.criticalIdentificationBonus,
  );

  const updatedResults = [...attempt.evolutionResults, evolutionScore];
  const evolutionIndex = caseSpec.evolutions.findIndex((e) => e.id === evolutionId);
  const nextEvolution = caseSpec.evolutions[evolutionIndex + 1] ?? null;
  const isComplete = nextEvolution === null;

  const attemptScore = isComplete ? scoreAttempt(updatedResults) : null;

  const { error } = await supabase
    .from("case_attempts")
    .update({
      evolution_results: updatedResults,
      current_evolution_id: nextEvolution?.id ?? null,
      status: isComplete ? "completed" : "in_progress",
      final_score: attemptScore?.finalScore ?? null,
      max_possible_score: attemptScore?.maxPossibleScore ?? null,
      ended_at: isComplete ? new Date().toISOString() : null,
    })
    .eq("id", attempt.id);

  if (error) throw new Error(`submitEvolution failed: ${error.message}`);

  return { evolutionScore, isComplete, nextEvolutionId: nextEvolution?.id ?? null, attemptScore };
}
