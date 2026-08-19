-- Phase 2: a run is a sequence of timed decisions, not a set of per-evolution
-- classifications. evolution_results is replaced by decisions; final_score and
-- max_possible_score keep their meaning (now weighted points, see plan.md).
--
-- initial_conduct_text is intentionally left in place. The reflection gate is
-- dropped in Phase 2, so nothing writes to it any more, but existing rows stay
-- readable rather than being destroyed by this migration.

alter table public.case_attempts
  add column if not exists decisions jsonb not null default '[]';

comment on column public.case_attempts.decisions is
  '[{stepId, optionId, timedOut, at}] — the run, in order. Rescored server-side by scoreRun().';

comment on column public.case_attempts.evolution_results is
  'Phase 1 only. Superseded by decisions; kept so historical attempts remain readable.';

comment on column public.case_attempts.initial_conduct_text is
  'Phase 1 only. The pre-case reflection gate was dropped in Phase 2; nothing writes here now.';
