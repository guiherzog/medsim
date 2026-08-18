-- Case lifecycle status (plan.md Q12): hardcoded per case, not derived.
-- disabled/draft are reserved for a future admin flow, not produced by
-- anything in Phase 0-1. under_review = AI-drafted, seeded and playable,
-- approved_by/approved_at blank. reviewed = a real doctor's sign-off is
-- present. The seed script never fabricates a sign-off.
create table public.cases (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category text not null,
  disclaimer text not null,
  case_spec jsonb not null, -- baseCase + evolutions[] + scoring, per DESIGN_SYSTEM.md/plan.md schema
  status text not null default 'draft' check (status in ('disabled', 'draft', 'under_review', 'reviewed')),
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.cases enable row level security;

-- Only under_review/reviewed cases are ever visible to students; draft/disabled
-- stay invisible until a future admin flow explicitly promotes them.
create policy "playable cases are viewable by any authenticated user"
  on public.cases for select
  to authenticated
  using (status in ('under_review', 'reviewed'));
