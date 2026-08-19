# MedSim AI — Phase 1 Focus: Deterministic Case Simulation Engine

## Context

MedSim AI is an AI-assisted clinical case simulator for Brazilian medical students/residents/new grads (pitch + mockups already exist in a Claude Design project). The local repo (`/Users/guiherzog/projects/medsim`) is currently empty besides a README.

**Architecture decision**: cases must be **completely deterministic** at runtime — no LLM ever drives narrative, vitals, or scoring live. AI may assist *drafting* a case offline, but a doctor/preceptor must review and approve it before use. This removes the runtime AI-provider dependency from this phase entirely.

**Content decision (this round)**: the user provided real, hand-written case material that defines the actual authoring format to build around, replacing the earlier speculative "branching vitals sim" design. The real format is a **case → fixed evolution sequence → multi-select conduct identification**, not a choose-your-own-path branching tree. The engine and schema below are redesigned to match this format exactly.

**Content authoring decision**: rather than transcribing the original source verbatim, the 3 cases are **AI-invented** from the short clinical summaries captured below (case premise + per-evolution direction, e.g. "1.B FV em transporte"), fleshed out into full narrative/vitals/6-options/rationale per the schema. This is exactly the "AI may assist drafting a case offline" path the architecture decision above already anticipates — these 3 cases are drafts pending real doctor review, not transcriptions of already-reviewed material. They seed with `status: under_review`, never `reviewed` (see Case Lifecycle Status in the Data Model section).

**Scope for this pass**: Phase 0 (minimal scaffold) + Phase 1 (deterministic engine + all 3 cases playable end-to-end with deterministic scoring). A minimal styled case list (3 cards, no stats/history) is in scope as the only way to reach a case; a full dashboard (progress, attempt history, per-case scores), onboarding, paywall/usage limits, and any user feedback/rating mechanism on cases are explicitly out of scope for this pass (paywall dropped per earlier feedback).

## Source Material → Case Format

The user supplied "Simulado de Emergências Médicas" — 3 full clinical cases, each with 3 fixed evoluções (evolution stages), each evolução offering 6 shuffled conduct options (3 correct / 3 incorrect, one incorrect flagged as the gravest "erro crítico"). Application flow per the source doc: **present case-base → give 2–3 min for an initial (ungraded/reflective) conduct → reveal the evolution → present the 6 shuffled options → candidate marks which are correct/incorrect and identifies the most dangerous one → immediate scoring → next evolution.**

The three cases (to be authored into YAML in Phase 1 by fleshing out the summaries below into full narrative/vitals/options/rationale per the schema — see Content authoring decision above):
1. **`dor-toracica-iam-vd`** — Cardiologia. 58M, IAM inferior com supra em DII/DIII/aVF → 1.A infarto de VD/hipotensão pós-nitrato → 1.B FV em transporte → 1.C pós-angioplastia bem-sucedida.
2. **`anafilaxia-amoxicilina`** — Alergia/Emergência. 24F, anafilaxia após amoxicilina → 2.A via aérea/estridor → 2.B reação bifásica → 2.C choque refratário em uso de propranolol.
3. **`sepse-urinaria-idoso`** — Emergência/UTI. 72M, sepse de foco urinário → 3.A choque refratário a volume → 3.B SDRA → 3.C melhora/desmame.

Each carries the source's **AVISO** disclaimer ("Material didático baseado em condutas de referência ACLS/AHA, WAO/EAACI, Surviving Sepsis Campaign... deve ser revisado por preceptor responsável e confrontado com os protocolos institucionais vigentes antes da aplicação") in its YAML and in `cases.disclaimer`.

**Revised (superseding the earlier "persistent banner on every case screen" decision):** the per-case banner is gone. Its credibility half — the reference protocols the cases are built on — is now a selling point on the home page (`ProtocolReferences`). The unreviewed-status half is carried by the case's `status`, surfaced as the "Em validação" badge on the case list. `cases.disclaimer` is still authored, stored and available, but is no longer rendered in the case-play UI.

## Case Schema (YAML)

```yaml
# content/cases/dor-toracica-iam-vd.yaml
slug: dor-toracica-iam-vd
title: "Dor torácica em homem de 58 anos"
category: Cardiologia
disclaimer: "Material didático baseado em condutas de referência (ACLS/AHA)... revisado por preceptor responsável..."
approval:
  approvedBy: "Dr. <preceptor>"
  approvedAt: "2026-08-18"
baseCase:
  narrative: "Homem, 58 anos, hipertenso e tabagista (40 maços-ano)... ECG: supra de ST em DII, DIII, aVF..."
  vitals: { pa: "130/80", fc: 62, spo2: 96 }
  initialConductSeconds: 150     # 2-3 min reflection before evolution reveals; hard gate (reveal disabled until elapsed), free text persisted but not auto-scored
evolutions:
  - id: "1.A"
    direction: piora             # piora | melhora
    narrative: "Após nitrato sublingual, evolui com PA 72/40 mmHg, palidez, turgência jugular..."
    vitals: { pa: "72/40", fc: null, spo2: null }
    options:
      - id: a1
        text: "Suspender nitrato e infundir cristaloide 250–500 mL em bólus..."
        correct: true
        rationale: "Repõe pré-carga em VD dependente de volume; reverte a hipotensão pós-nitrato."
      - id: a2
        text: "ECG com derivações direitas (V3R–V4R)..."
        correct: true
        rationale: "Confirma infarto de VD, mudando a conduta imediata."
      - id: a3
        text: "Manter/acelerar reperfusão (hemodinâmica)..."
        correct: true
        rationale: "A reperfusão definitiva continua sendo a prioridade terapêutica."
      - id: a4
        text: "Repetir nitrato sublingual ou iniciar NTG IV..."
        correct: false
        critical: true            # the flagged "erro crítico" for this evolution
        rationale: "Agrava hipotensão por reduzir pré-carga em VD dependente de volume."
      - id: a5
        text: "Furosemida IV presumindo congestão..."
        correct: false
        rationale: "Reduz ainda mais a pré-carga em um paciente que precisa de volume, não de diurético."
      - id: a6
        text: "Betabloqueador IV em paciente hipotenso..."
        correct: false
        rationale: "Piora a hipotensão ao reduzir a resposta cronotrópica compensatória."
    # every option carries `rationale` — all 6, not just the critical one — shown in debrief for review
  - id: "1.B"
    direction: piora
    narrative: "Durante o transporte para hemodinâmica, perde a consciência. FV, pulso ausente."
    options: [ ... 3 correct / 3 incorrect, critical: true on "cardioversão sincronizada" ... ]
  - id: "1.C"
    direction: melhora
    narrative: "RCE após 2º choque. Angioplastia com stent, TIMI 3. 6h depois: assintomático..."
    options: [ ... critical: true on "liberar o paciente" ... ]
scoring:
  perOptionCorrectlyClassified: 1   # awarded per option (6 max) if user's correct/incorrect call matches ground truth
  criticalIdentificationBonus: 2    # awarded if user flags the one "critical" option as most-dangerous
                                     # "most dangerous" pick is unrestricted (any of the 6, even ones marked correct) —
                                     # the two scoring checks are independent, no special-case handling for self-contradictory picks
  perEvolutionMax: 8
```

This schema is the authoring target for all 3 cases — narrative, vitals, and all 6 options (each with `correct`, optional `critical`, and always a `rationale`) are invented per the Content authoring decision above, using the summaries already captured as the clinical skeleton. Same schema for the other two cases.

## i18n

All source code (identifiers, comments, schema field names, file names) is written in English. All **UI copy** (buttons, labels, screen headings, error messages) is externalized through `next-intl` with a single `pt-BR` locale for now — no hardcoded Portuguese strings inline in components. This costs almost nothing now and means adding a second locale later is a translation-file exercise, not a refactor.

- `messages/pt-BR.json` — the only catalog needed for this pass, keyed in English (e.g. `case.disclaimer`, `evolution.submit`, `debrief.criticalMissed`).
- `i18n/request.ts` — next-intl config, locale hardcoded to `pt-BR` for now (no locale switcher UI needed yet).
- Components call `useTranslations()`/`getTranslations()` — never inline Portuguese strings.

**Case content is data, not UI chrome** — the clinical scenario text in `content/cases/*.yaml` (narrative, options, rationale) is inherently authored in Portuguese as part of the CaseSpec, doctor-approved as such, and is **not** routed through the i18n string catalog. Localizing case content later would mean authoring parallel case files, not swapping catalog strings — noted here so it isn't mistaken for a gap in the i18n setup.

## Repo Structure

```
medsim/
├── middleware.ts                     # Supabase session refresh
├── i18n/request.ts                   # next-intl config (pt-BR only for now)
├── messages/pt-BR.json                # all UI copy, English-keyed
├── app/
│   ├── (auth)/login/page.tsx                 # "Sign in with Google" only — no email/password form
│   ├── auth/callback/route.ts                # Supabase OAuth callback handler
│   └── (student)/cases/
│       ├── page.tsx                                # styled list of playable cases (status under_review|reviewed only)
│       └── [caseId]/
│           ├── page.tsx                          # case-base + initial-conduct timer screen (hard-gated)
│           ├── run/[attemptId]/page.tsx           # evolution screen: narrative + 6 shuffled options
│           └── debrief/[attemptId]/page.tsx       # per-evolution + total score, critical misses
├── app/api/
│   ├── cases/[caseId]/attempts/route.ts       # POST: start attempt -> first evolution
│   ├── attempts/[attemptId]/evolutions/[evoId]/submit/route.ts   # POST: selections -> score that evolution
│   └── attempts/[attemptId]/debrief/route.ts  # GET: aggregate final score/breakdown
├── lib/
│   ├── engine/
│   │   ├── types.ts               # CaseSpec, Evolution, Option, EngineResult
│   │   ├── caseSpec.schema.ts     # Zod schema — validated at seed time AND at load time
│   │   ├── loadCaseSpec.ts        # parses+validates a YAML file into CaseSpec
│   │   ├── shuffle.ts             # deterministic-per-attempt shuffle of an evolution's 6 options
│   │   ├── scoreEvolution.ts      # (evolution, userSelections) -> points + which were missed/wrong, pure fn
│   │   ├── scoreAttempt.ts        # aggregates all evolution scores -> case total + critical-miss list
│   │   └── __tests__/             # unit tests: fixture case, known selections -> exact expected scores
│   ├── db/client.ts, browserClient.ts, queries/{cases,attempts}.ts
│   └── auth/session.ts
├── components/{case-runner,debrief}/
├── content/cases/
│   ├── dor-toracica-iam-vd.yaml
│   ├── anafilaxia-amoxicilina.yaml
│   └── sepse-urinaria-idoso.yaml
├── db/migrations/0001_profiles.sql, 0002_cases.sql, 0003_attempts.sql
└── db/seed/seed_cases.ts             # loads content/cases/*.yaml, validates, refuses unapproved, upserts by slug
```

No `llmClient.ts` / AI SDK dependency in this phase — the engine is pure data + set-comparison logic, fully unit-testable without network calls.

## Data Model (Postgres, trimmed to Phase 0-1 needs)

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz not null default now()
);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category text not null,
  disclaimer text not null,
  case_spec jsonb not null,             -- baseCase + evolutions[] + scoring, per schema above
  status text not null default 'draft' check (status in ('disabled','draft','under_review','reviewed')),
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.case_attempts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id),
  user_id uuid not null references public.profiles(id),
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  current_evolution_id text,
  initial_conduct_text text,            -- free-text reflection from the pre-evolution hard-gated timer; persisted, never auto-scored
  evolution_results jsonb not null default '[]',
  -- [{evolutionId, selections: {optionId: 'correct'|'incorrect'}, mostDangerousPick, score, criticalMissed}]
  final_score int,
  max_possible_score int,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
```

`cases.approved_by`/`approved_at` populate straight from the YAML's `approval:` block at seed time. **Case lifecycle status** (hardcoded per case, not derived): `disabled` and `draft` are reserved for a future admin flow (not produced by anything in this phase); `under_review` = AI-drafted, seeded and playable, `approved_by`/`approved_at` blank; `reviewed` = a real doctor's sign-off is present in the YAML. The seed script sets `under_review` vs `reviewed` based on whether both approval fields are filled — it never fabricates a sign-off. The case list and the attempt-start API only serve `under_review`/`reviewed` cases; `draft`/`disabled` cases are filtered out everywhere. The UI always shows a status-appropriate badge (e.g. "Em validação" for `under_review`) so an unreviewed case is never presented as doctor-approved.

## Engine Logic

- **`scoreEvolution(evolution, userSelections)`**: for each of the 6 options, compare the user's correct/incorrect call against `option.correct` — 1 point per match (max 6). If the user correctly names the `critical: true` option as the single most-dangerous one, +2 bonus (max 8/evolution, matching the source rubric exactly). The most-dangerous pick is unconstrained by the UI — any of the 6 options can be nominated, including one the user just marked "correct" — the two checks are independent, so that self-contradiction needs no special-case scoring logic. Returns which options were misclassified and whether the critical one was missed, for debrief display. Pure function, no I/O.
- **`scoreAttempt`**: sums all evolution scores into `final_score`/`max_possible_score`, collects every evolution where the critical option was missed (surfaced in debrief as the "critical failure" callouts, mirroring the original mockup's single-highlight design but per evolution here since the source material scores that way).
- **Shuffling**: options are shuffled once per attempt (seeded by `attemptId`) in `shuffle.ts` so order is stable within a run (no re-shuffle on refresh) but varies across attempts — server does the shuffle and stores the presented order in `evolution_results` so scoring always matches what the user actually saw.
- **Initial-conduct step**: a 2–3 min timer per the source's instructions before the evolution reveals, implemented as a **hard gate** — the reveal button stays disabled until the timer elapses, no skip. The candidate's free-text answer is persisted (`case_attempts.initial_conduct_text`) but intentionally **ungraded** in the prototype (no LLM grading of open text, staying fully deterministic). Can be revisited later if free-text grading becomes a requirement.

## Commit Discipline

Each deliverable below gets its own commit as soon as it's working — not one big commit per phase. This keeps history revertable/revisable at a fine grain (e.g., roll back just the shuffle logic without losing the schema work). Rough granularity: one commit per numbered step within Phase 0 and Phase 1 (scaffold, i18n wiring, DB migrations, engine types, each engine function + its tests, each transcribed case file, seed script, each UI screen, each API route). Commit messages describe the deliverable, not the phase.

## Phased Build Order (this pass)

**Phase 0, step 0 — Commit this plan**: copy this plan document into the repo as `plan.md` at the repo root and commit it first, before any scaffolding — so the plan itself is under version control and revertable/revisable alongside the code it describes.

**Phase 0 — Scaffold**: `create-next-app` (TS/App Router/Tailwind), `next-intl` wired with `pt-BR` locale + empty `messages/pt-BR.json`, migrations 0001-0003, Google OAuth wired through Supabase Auth (Google Cloud OAuth client + redirect URI `https://eirukxgswpzuppcstlzw.supabase.co/auth/v1/callback`, provider enabled in the Supabase dashboard), auth middleware + `/auth/callback` route, `vercel link` to the `medsim` project + deploy connected.

Supabase project `medsim` (`sa-east-1`, org Herzog, ref `eirukxgswpzuppcstlzw`) and Vercel project `medsim` (scope `guiherzogs-projects`) are already provisioned — only wiring remains.

*Done when*: "Sign in with Google" works end-to-end and lands on an empty authenticated shell on a live preview URL, with even placeholder UI copy already flowing through `useTranslations()`.

**Phase 1 — Deterministic engine + all 3 real cases playable**:
1. `lib/engine/types.ts`, `caseSpec.schema.ts`, `loadCaseSpec.ts`, `shuffle.ts`, `scoreEvolution.ts`, `scoreAttempt.ts` + unit tests on a fixture case (no DB, no network) covering: all-correct selection, all-wrong, critical-missed, critical-identified.
2. Author all 3 cases into `content/cases/*.yaml` per the Content authoring decision — invent narrative/vitals/options/rationale from the summaries, `approval:` left blank (no real doctor review has happened), AVISO disclaimer text intact.
3. `db/seed/seed_cases.ts` — load, validate, set `status` to `reviewed` if both `approval` fields are present else `under_review` (never fabricates a sign-off, never hard-errors on missing approval), upsert by slug.
4. Case UI: styled case-list screen (3 cards, `under_review`/`reviewed` only, status badge) → case-base screen (narrative + vitals + hard-gated initial-conduct timer, free text persisted) → evolution screen (narrative + vitals update + 6 shuffled options as multi-select + unrestricted "most dangerous" single-select) → per-evolution instant feedback → next evolution → final debrief (total score, per-evolution breakdown, critical misses, rationale text for all 6 options shown for review).
5. Wire the API routes to the engine functions + DB persistence. Disclaimer banner rendered on every case screen.

*Done when*: a logged-in user can find all 3 cases from the case-list screen, complete each end-to-end (9 evoluções total), see immediate per-evolution scoring, reach a final debrief matching the source rubric's point values exactly, the same selections always reproduce the same score, and every case is visibly marked `under_review` (never silently presented as doctor-approved).

**Explicitly not in this pass**: onboarding, a real dashboard (progress/attempt-history/per-case scores — the case list is just 3 styled cards, not a dashboard), paywall/usage limits, admin case builder, user feedback/rating on cases, real Stripe, native mobile, any runtime LLM call, free-text justification grading, resuming an in-progress attempt (each visit/reattempt starts a fresh `case_attempts` row).

## Verification

- `vitest run` — engine unit tests: known selection sets against each case's answer key, assert exact point totals (including the 72-point full-simulado total across all 9 evoluções if run as one suite); include a self-contradictory "most dangerous" pick as an explicit test case.
- Manual: complete Caso 1 end-to-end (1.A → 1.B → 1.C), deliberately picking the critical error once to confirm it's flagged in debrief; repeat for Casos 2 and 3.
- Confirm `seed_cases.ts` sets `status: under_review` (not `reviewed`) for all 3 cases, since none have real `approval.approvedBy`/`approvedAt`.
- Confirm the case list only shows `under_review`/`reviewed` cases and renders the correct status badge for each.
- Confirm the home page shows the reference-protocol selling point, and that unreviewed cases are still badged "Em validação" on the case list.
- Confirm "Sign in with Google" completes the OAuth round trip and lands on the authenticated shell.
- Confirm the initial-conduct reveal button stays disabled until the timer elapses, and the free-text answer is saved to `case_attempts.initial_conduct_text`.
