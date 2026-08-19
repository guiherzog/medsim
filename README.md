# MedSim

AI-assisted clinical case simulator for Brazilian medical students/residents. Cases are deterministic at runtime — no LLM drives narrative, vitals, or scoring live; AI may only assist drafting a case offline, and every case must carry a real doctor's `approval` before it's trustworthy (see `plan.md`'s Case Lifecycle Status).

- **`HANDOFF.md`** — start here: current state, infrastructure, and the gotchas worth not re-deriving.
- **`plan.md`** — the build plan: architecture decisions, case schema, data model, phased build order.
- **`DESIGN_SYSTEM.md`** — component/UI conventions (shadcn/ui-based, `components/ui` → `components/{layout,case-runner,debrief}`).

## Setup

```bash
pnpm install
```

Environment variables (`.env.local`, gitignored):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-only, used by db/seed/seed_cases.ts
DEV_LOGIN_EMAIL=                # dev-only auth bypass, see app/(auth)/login
DEV_LOGIN_PASSWORD=
```

## Commands

```bash
pnpm dev          # start the dev server
pnpm build        # production build
pnpm lint         # eslint
pnpm test         # Vitest — engine unit tests
pnpm test:e2e     # Playwright — auth + full case playthrough
pnpm seed         # load content/cases/*.yaml into the DB (db/seed/seed_cases.ts)
```

## Auth

Production auth is Google OAuth only (via Supabase Auth). Since creating the Google Cloud OAuth client requires a one-time manual step in the Google Cloud Console, `/login` also shows a dev-only "Entrar como usuário de teste (dev)" button (hidden once `NODE_ENV=production`) that signs in a real Supabase auth user via `signInWithPassword`, using the `DEV_LOGIN_EMAIL`/`DEV_LOGIN_PASSWORD` credentials.

## Case content

Cases live as YAML in `content/cases/`, validated against `lib/engine/caseSpec.schema.ts`. `pnpm seed` upserts them by slug; a case's `status` becomes `reviewed` only when its YAML has both `approval.approvedBy` and `approval.approvedAt` filled in by a real reviewer — otherwise it seeds as `under_review` and is clearly badged as such in the UI.
