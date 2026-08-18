create table public.case_attempts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id),
  user_id uuid not null references public.profiles(id),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  current_evolution_id text,
  initial_conduct_text text, -- free-text reflection from the hard-gated pre-evolution timer; persisted, never auto-scored
  evolution_results jsonb not null default '[]',
  -- [{evolutionId, selections: {optionId: 'correct'|'incorrect'}, mostDangerousPick, score, criticalMissed}]
  final_score int,
  max_possible_score int,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

alter table public.case_attempts enable row level security;

-- Unlimited reattempts (plan.md Q7): each attempt is its own row, owned by
-- exactly one user, with no cross-user visibility and no resume-in-progress
-- feature — a user only ever sees their own attempts.
create policy "attempts are owned by the user who started them"
  on public.case_attempts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index case_attempts_user_id_idx on public.case_attempts (user_id);
create index case_attempts_case_id_idx on public.case_attempts (case_id);
