# MedSim — handoff

Written to start a fresh session with full context. Read this first, then
`plan.md` (decisions and phases) and `DESIGN_SYSTEM.md` (UI conventions).

**State:** working end-to-end on a Vercel preview. 34 commits on
`phase-0-scaffold`, 53 unit tests + 7 e2e tests green. Never promoted to
production. Nothing is merged to `main`.

---

## What this is

An AI-assisted clinical case simulator for Brazilian medical students and
residents, in pt-BR. A case is a **real-time emergency simulation**: you take the
case, a live monitor shows the patient's vitals, and you make one decision at a
time under a clock. Each decision changes the vitals and the patient's course.

**Cases are deterministic at runtime — no LLM is ever called.** Every option
carries authored consequences (outcome text, target vitals, next step). The
"live" feel comes from an easing drift toward the authored target plus an elapsed
clock, so a given sequence of decisions always replays identically and stays
unit-testable. AI is used only to *draft* case content offline.

## The most important thing to know

This started as an **exam** (Phase 1: six conducts per evolution, classify each
correct/incorrect, pick the most dangerous) and was **replaced** by the real-time
simulation (Phase 2). If you find references to `evolutions`, `scoreEvolution`,
`scoreAttempt` or "classify" anywhere, they are Phase 1 leftovers in comments or
DB columns — the live format is `steps[]`. `plan.md`'s Phase 2 section supersedes
several earlier decisions in the same file, and says which.

---

## Current flow

1. `/login` — hero + "Entrar com Google" + a dev-only login button.
2. `/cases` — "Casos disponíveis", grouped by specialty, richer cards.
3. `/cases/[slug]` — briefing: patient card, admission vitals, **"Assumir o caso"**.
4. `/cases/[slug]/run/[attemptId]` — monitor pinned top, scrollable timestamped
   activity log in the middle, decisions docked at the bottom under a countdown.
5. `/cases/[slug]/debrief/[attemptId]` — outcome art, score ring, callouts,
   microvídeos, and the run replayed with each decision's rationale.

### Scoring
Weighted points: `+10` per correct decision, `−5` per critical error, `−5` per
expired clock, floored at 0. `maxScore` = steps × 10.

**Scoring is server-authoritative.** The full case spec (including the answer
key) is sent to the client for latency — an accepted trade, recorded in
`plan.md` — but `/api/attempts/[id]/decisions` rescores the whole run from the
DB's own `case_spec` via `scoreRun`, and an unrecognised option id is treated as
a timeout rather than trusted. So a peeked answer key lets someone see answers,
never forge a score.

---

## Infrastructure

| | |
|---|---|
| Supabase | project `medsim`, ref `eirukxgswpzuppcstlzw`, region **sa-east-1**, org Herzog |
| Vercel | project `medsim`, scope `guiherzogs-projects`, functions pinned to **gru1** |
| Repo | `github.com/guiherzog/medsim` — dev branch `phase-0-scaffold`, draft PR #1 |
| Migrations | `db/migrations/0001`–`0004`, applied via `supabase db query --linked` |

Secrets are in `.env.local` (gitignored): Supabase URL/keys and
`DEV_LOGIN_EMAIL`/`DEV_LOGIN_PASSWORD`. Preview deployments sit behind Vercel
Deployment Protection; get the bypass token with
`vercel project protection medsim --json` and append
`?x-vercel-protection-bypass=<token>&x-vercel-set-bypass-cookie=true` to a URL.

```bash
pnpm dev              # dev server
pnpm build / lint
pnpm test             # 53 unit tests (pure engine, hermetic)
pnpm test:integration # RLS isolation against the live DB — opt-in, needs .env.local
pnpm test:e2e         # 7 Playwright tests against a running dev server
pnpm seed             # load content/cases/*.yaml into the DB
```

---

## Hard-won gotchas

Each of these cost real debugging time. Don't re-derive them.

1. **Vercel functions must run in `gru1`.** From the default region (fra1,
   Frankfurt) every `POST` to Supabase `sa-east-1`'s `/auth/v1/token` **hung
   until the function was killed**, while `GET /auth/v1/user` returned in 0.2s
   and the same POST from a laptop took 0.4s. This broke sign-in and any token
   refresh. `vercel.json` pins the region. If auth mysteriously hangs, check this
   first.
2. **There is no middleware, on purpose.** `middleware.ts` was deleted: its
   Supabase call hung in Vercel's Edge runtime (`did not return an initial
   response within 25s`), and forcing `runtime: "nodejs"` failed to load as ESM.
   Auth is enforced per-page by `requireUser()`. The cost is no proactive session
   refresh, so a long-idle session may need a re-login. Revisit with Next's
   `nodeMiddleware` when it stabilises.
3. **The Vercel framework preset must be `nextjs`.** `vercel project add` left it
   `null`, so every deploy produced an empty build and 404'd on every route while
   *reporting success*. Fixed with `vercel project update medsim --framework nextjs`.
4. **Vercel's build cache can poison a build.** After the Next 16→15 downgrade,
   restored caches produced broken output. `vercel deploy --force` skips it.
5. **Next.js 15, not 16.** Next 16's Deployment Adapter architecture wasn't
   reliably supported. Don't upgrade casually.
6. **The dev login runs in the browser, not a Server Action.** `/api/dev-login`
   hands the throwaway credentials to the client, which signs in against Supabase
   directly. It 404s unless non-production. This predates the region fix and
   could probably be simplified back now — untested.
7. **`isNonProductionDeployment()` checks `VERCEL_ENV`, not `NODE_ENV`.** Next
   sets `NODE_ENV=production` on previews too, so `NODE_ENV` alone hides
   dev-only affordances on preview deployments.
8. **`globals.css` font tokens must point at the `next/font` variables** that
   `app/layout.tsx` defines. shadcn's init wrote `--font-sans: var(--font-sans)`,
   a self-reference that resolves to nothing — every element fell back to the
   browser's serif and the whole app looked unstyled.
9. **`mx-auto` on a flex child collapses its width.** `body` is `flex flex-col`,
   so a centred container needs `w-full` alongside `max-w-*` or it shrinks to
   fit-content.
10. **`line-clamp-*` can't share an element with `flex`** — it sets
    `display:-webkit-box`. Put the clamped text in its own child.
11. **Use `100dvh`, not `100vh`,** for the run screen; iOS's URL bar makes `100vh`
    taller than the visible area and clips the docked decisions.
12. **One clock drives everything in `useRun`.** Elapsed time, the vitals drift,
    the alarm thresholds and the decision countdown all live on a single 1s
    tick. Splitting the countdown into its own effect stalled it, because the
    effect's deps changed every second and tore the interval down before it
    fired. The timeout is guarded per step so it fires once, not per re-render.
13. **Delta colour is not the sign of the delta.** `vitalChanges()` measures each
    reading's distance from its normal band before and after: closer is better,
    further is worse. That's why `FR 26 → 20 (-6)` is green and
    `FR 22 → 28 (+6)` is red.
14. **Playwright and the mocked clock:** call `page.clock.install()` *before*
    `goto`, use `runFor` (not `fastForward`) so the recurring interval actually
    fires, and wait for the countdown to mount before advancing — otherwise a
    slow first compile eats the ticks.

---

## Where things live

```
plan.md                  decisions + phases; Phase 2 supersedes parts of Phase 1
DESIGN_SYSTEM.md         UI conventions, tokens, component inventory, illustrations
lib/engine/              pure, tested, no I/O: types, schema, scoreRun, vitalStatus, drift
lib/sim/useRun.ts        the client run loop (one clock)
lib/db/queries/          cases + attempts; recordDecision rescores server-side
content/cases/*.yaml     the 3 cases, validated by caseSpec.schema.ts
components/case-runner/  briefing, monitor, vital tiles, log entries, runner
components/debrief/      RunDebrief + OutcomeCallout
components/illustrations/ duotone inline SVG (no image assets ship)
```

**Branch `prototype/realtime-sim`** is a throwaway UI prototype (4 rounds) that
validated the run-screen composition, kept as the primary source for *why* the
design is what it is. Don't promote its code — it was written with no tests and
no persistence.

---

## Outstanding

**Needs a human, blocking:**
- **Google OAuth** is wired end-to-end but needs a one-time Google Cloud Console
  OAuth client, with redirect URI
  `https://eirukxgswpzuppcstlzw.supabase.co/auth/v1/callback`, pasted into
  Supabase Auth providers. Until then only the dev-login button works.
- **Clinical review.** All three cases are **AI-drafted and never reviewed by a
  clinician**. They seed as `status: under_review` and are badged "Em validação"
  in the UI. `approval` is deliberately left blank in the YAML — the seed script
  never fabricates a sign-off. Nothing should reach real students before a
  preceptor reads them.

**Known incomplete:**
- **Microvídeos are placeholder cards.** No video assets exist; nothing plays.
- Never promoted to production — every deploy has been a preview.
- The web-app design file (`MedSim Web App.dc.html` in Claude Design) was never
  readable by the assistant; all design work came from the **mobile mocks**
  artifact (`claude.ai/code/artifact/6b572987-...`). If the web design differs,
  that's unreconciled.

**Deliberately out of scope** (`plan.md`) — absence is a decision, not a gap:
- Paywall / `GRÁTIS HOJE` / `PRO 🔒` chips.
- Dashboard, readiness index, per-category mastery, gap analysis, streaks.
- Onboarding (career stage, focus area).
- User feedback/rating on cases.
- The pre-case reflection gate was **dropped** in Phase 2 (reversing an earlier
  decision) because forcing a wait works against the pressure the run relies on.
  `case_attempts.initial_conduct_text` is now unused but kept so historical rows
  stay readable.
