# MedSim AI — Phase 1 Focus: Deterministic Case Simulation Engine

## Context

MedSim AI is an AI-assisted clinical case simulator for Brazilian medical students/residents/new grads (pitch + mockups already exist in a Claude Design project). The local repo (`/Users/guiherzog/projects/medsim`) is currently empty besides a README.

**Architecture decision**: cases must be **completely deterministic** at runtime — no LLM ever drives narrative, vitals, or scoring live. AI may assist *drafting* a case offline, but a doctor/preceptor must review and approve it before use. This removes the runtime AI-provider dependency from this phase entirely.

**Content decision (this round)**: the user provided real, hand-written case material that defines the actual authoring format to build around, replacing the earlier speculative "branching vitals sim" design. The real format is a **case → fixed evolution sequence → multi-select conduct identification**, not a choose-your-own-path branching tree. The engine and schema below are redesigned to match this material exactly.

**Scope for this pass**: Phase 0 (minimal scaffold) + Phase 1 (deterministic engine + all 3 provided cases playable end-to-end with deterministic scoring). Onboarding/dashboard and paywall/usage limits are out of scope for this pass (paywall dropped per earlier feedback).

## Source Material → Case Format

The user supplied "Simulado de Emergências Médicas" — 3 full clinical cases, each with 3 fixed evoluções (evolution stages), each evolução offering 6 shuffled conduct options (3 correct / 3 incorrect, one incorrect flagged as the gravest "erro crítico"). Application flow per the source doc: **present case-base → give 2–3 min for an initial (ungraded/reflective) conduct → reveal the evolution → present the 6 shuffled options → candidate marks which are correct/incorrect and identifies the most dangerous one → immediate scoring → next evolution.**

The three cases (to be transcribed into YAML in Phase 1, using the exact text already provided in this conversation as the authoring source):
1. **`dor-toracica-iam-vd`** — Cardiologia. 58M, IAM inferior com supra em DII/DIII/aVF → 1.A infarto de VD/hipotensão pós-nitrato → 1.B FV em transporte → 1.C pós-angioplastia bem-sucedida.
2. **`anafilaxia-amoxicilina`** — Alergia/Emergência. 24F, anafilaxia após amoxicilina → 2.A via aérea/estridor → 2.B reação bifásica → 2.C choque refratário em uso de propranolol.
3. **`sepse-urinaria-idoso`** — Emergência/UTI. 72M, sepse de foco urinário → 3.A choque refratário a volume → 3.B SDRA → 3.C melhora/desmame.

Each carries the source's mandatory **AVISO** disclaimer ("Material didático baseado em condutas de referência ACLS/AHA, WAO/EAACI, Surviving Sepsis Campaign... deve ser revisado por preceptor responsável e confrontado com os protocolos institucionais vigentes antes da aplicação") — shown as a persistent banner in the case UI, not just doc metadata.

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
  initialConductSeconds: 150     # 2-3 min reflection before evolution reveals; not auto-scored
evolutions:
  - id: "1.A"
    direction: piora             # piora | melhora
    narrative: "Após nitrato sublingual, evolui com PA 72/40 mmHg, palidez, turgência jugular..."
    vitals: { pa: "72/40", fc: null, spo2: null }
    options:
      - { id: a1, text: "Suspender nitrato e infundir cristaloide 250–500 mL em bólus...", correct: true }
      - { id: a2, text: "ECG com derivações direitas (V3R–V4R)...", correct: true }
      - { id: a3, text: "Manter/acelerar reperfusão (hemodinâmica)...", correct: true }
      - id: a4
        text: "Repetir nitrato sublingual ou iniciar NTG IV..."
        correct: false
        critical: true            # the flagged "erro crítico" for this evolution
        rationale: "Agrava hipotensão por reduzir pré-carga em VD dependente de volume."
      - { id: a5, text: "Furosemida IV presumindo congestão...", correct: false }
      - { id: a6, text: "Betabloqueador IV em paciente hipotenso...", correct: false }
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
  perEvolutionMax: 8
```

This is a direct, lossless transcription target for the material already provided — nothing about it needs to be invented. Same schema for the other two cases.

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
│   ├── (auth)/login, signup
│   └── (student)/cases/[caseId]/
│       ├── page.tsx                          # case-base + initial-conduct timer screen
│       ├── run/[attemptId]/page.tsx           # evolution screen: narrative + 6 shuffled options
│       └── debrief/[attemptId]/page.tsx       # per-evolution + total score, critical misses
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
  status text not null default 'draft' check (status in ('draft','published')),
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
  evolution_results jsonb not null default '[]',
  -- [{evolutionId, selections: {optionId: 'correct'|'incorrect'}, mostDangerousPick, score, criticalMissed}]
  final_score int,
  max_possible_score int,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
```

`cases.approved_by`/`approved_at` populate straight from the YAML's `approval:` block at seed time. The seed script **refuses to publish** (errors out) any case missing both fields — a doctor's sign-off is a hard gate before content reaches the DB, not a UI nicety layered on later.

## Engine Logic

- **`scoreEvolution(evolution, userSelections)`**: for each of the 6 options, compare the user's correct/incorrect call against `option.correct` — 1 point per match (max 6). If the user correctly names the `critical: true` option as the single most-dangerous one, +2 bonus (max 8/evolution, matching the source rubric exactly). Returns which options were misclassified and whether the critical one was missed, for debrief display. Pure function, no I/O.
- **`scoreAttempt`**: sums all evolution scores into `final_score`/`max_possible_score`, collects every evolution where the critical option was missed (surfaced in debrief as the "critical failure" callouts, mirroring the original mockup's single-highlight design but per evolution here since the source material scores that way).
- **Shuffling**: options are shuffled once per attempt (seeded by `attemptId`) in `shuffle.ts` so order is stable within a run (no re-shuffle on refresh) but varies across attempts — server does the shuffle and stores the presented order in `evolution_results` so scoring always matches what the user actually saw.
- **Initial-conduct step**: a 2–3 min timer per the source's instructions before the evolution reveals; free-text or just a "pensou na sua conduta?" gate — intentionally **ungraded** in the prototype (no LLM grading of open text, staying fully deterministic). Can be revisited later if free-text grading becomes a requirement.

## Commit Discipline

Each deliverable below gets its own commit as soon as it's working — not one big commit per phase. This keeps history revertable/revisable at a fine grain (e.g., roll back just the shuffle logic without losing the schema work). Rough granularity: one commit per numbered step within Phase 0 and Phase 1 (scaffold, i18n wiring, DB migrations, engine types, each engine function + its tests, each transcribed case file, seed script, each UI screen, each API route). Commit messages describe the deliverable, not the phase.

## Phased Build Order (this pass)

**Phase 0, step 0 — Commit this plan**: copy this plan document into the repo as `plan.md` at the repo root and commit it first, before any scaffolding — so the plan itself is under version control and revertable/revisable alongside the code it describes.

**Phase 0 — Scaffold**: `create-next-app` (TS/App Router/Tailwind), `next-intl` wired with `pt-BR` locale + empty `messages/pt-BR.json`, Supabase project + CLI, migrations 0001-0003, auth middleware, Vercel deploy connected. *Done when*: signup works and lands on an empty authenticated shell on a live preview URL, with even placeholder UI copy already flowing through `useTranslations()`.

**Phase 1 — Deterministic engine + all 3 real cases playable**:
1. `lib/engine/types.ts`, `caseSpec.schema.ts`, `loadCaseSpec.ts`, `shuffle.ts`, `scoreEvolution.ts`, `scoreAttempt.ts` + unit tests on a fixture case (no DB, no network) covering: all-correct selection, all-wrong, critical-missed, critical-identified.
2. Transcribe all 3 cases from the source text into `content/cases/*.yaml`, each with `approval:` filled in and the AVISO disclaimer text intact.
3. `db/seed/seed_cases.ts` — load, validate, refuse-if-unapproved, upsert by slug.
4. Case UI: case-base screen (narrative + vitals + initial-conduct timer) → evolution screen (narrative + vitals update + 6 shuffled options as multi-select + "most dangerous" single-select) → per-evolution instant feedback → next evolution → final debrief (total score, per-evolution breakdown, critical misses, correct rationale text shown for review).
5. Wire the API routes to the engine functions + DB persistence. Disclaimer banner rendered on every case screen.

*Done when*: a logged-in user can complete all 3 cases end-to-end (9 evoluções total), see immediate per-evolution scoring, reach a final debrief matching the source rubric's point values exactly, and the same selections always reproduce the same score.

**Explicitly not in this pass**: onboarding/dashboard, paywall/usage limits, admin case builder, real Stripe, native mobile, any runtime LLM call, free-text justification grading.

## Verification

- `pnpm test` — engine unit tests: known selection sets against each real evolution's answer key, assert exact point totals (including the 72-point full-simulado total across all 9 evoluções if run as one suite).
- Manual: complete Caso 1 end-to-end (1.A → 1.B → 1.C), deliberately picking the critical error once to confirm it's flagged in debrief; repeat for Casos 2 and 3.
- Confirm `seed_cases.ts` refuses to publish a case whose YAML is missing `approval.approvedBy`/`approvedAt`.
- Confirm the AVISO disclaimer is visibly rendered on every case screen.
