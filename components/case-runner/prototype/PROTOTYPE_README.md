# PROTOTYPE — real-time sim feel (throwaway)

Variants of the case-run screen, switchable via `?variant=D|A|B|C` on the
existing `/cases/[caseId]/run/[attemptId]` route. **D is the chosen
composition** and the default.

## Round 2 — the answer so far

Round 1 shipped A (monitor dominante), B (feed de conversa) and C (cockpit
dividido). Verdict: **the monitor owning the screen (A) plus the timestamped log
(C)** — so D composes them: monitor pinned at the top, scrollable timestamped
activity log in the middle, decisions docked at the bottom.

Round 1's real-time cues were too subtle (one caption under the monitor). D
states it outright:

- `AO VIVO` pulse + elapsed clock in the monitor header.
- Per-vital trend arrows (↑/↓/–), recomputed every tick.
- A full-width critical banner naming the offending reading ("PA CRÍTICA — AJA AGORA").
- An explicit vitals-change line in the log: `PA 72/40 → 58/32 · FC 58 → 48 …`.
- A "PACIENTE EVOLUINDO…" ticker while a consequence lands.

D also carries the debriefing (`PrototypeDebrief`): score ring, what-went-well /
critical-failure callouts, the microvídeos earned, and the full timestamped run
so the candidate replays their own reasoning — the conduction log, not an
exam-style answer key.

A/B/C stay reachable for comparison until D is folded in for real.

## Round 3 — D confirmed, pressure and briefing added

**Briefing first.** `PrototypeBriefing` is the mocks' pre-case page — category
eyebrow + status badge, title, `⏱ meta` line, patient in a hatched-avatar card,
admission vitals on the deep panel, and **"Assumir o caso"**. It deliberately
does *not* hard-gate on a 2–3 min reflection timer the way the shipped case
screen does (plan.md Q8): forcing a wait before an emergency works against the
pressure this model runs on. Worth deciding explicitly when folding in.

**Pressure has teeth.** Every step carries `decisionSeconds` (30s for the
hypotension call, 12s for the VF) and an authored `timeout` consequence. The
countdown pill and bar escalate muted → amber → pulsing red, and running out
pushes a `timeout` entry, worsens the vitals and costs the decision — it is not
a free pass. Timeouts are reported separately in the debrief.

**Every entry kind has its own identity** (`LogEntry.tsx`): EVENTO (navy,
siren), SUA CONDUTA (primary, stethoscope), RESPOSTA DO PACIENTE (mint, heart),
VITAIS (mono numerals, activity), ALARME (red, bell), TEMPO ESGOTADO (amber,
timer-off), MICROVÍDEO (violet, play). Each is an icon + uppercase mono chip +
timestamp, so the log scans as a stream of different things happening.

**The app raises alarms on its own.** `ALARM_RULES` trips a one-shot `alarm`
entry when a reading crosses a threshold (PA sistólica < 70, no rhythm,
SpO₂ < 88) — the monitor shouts without waiting for the candidate.

Two bugs this round, both worth remembering for the real implementation:
the timeout fired once per re-render until guarded by a per-step ref, and the
countdown stalled because its effect listed `vitals` in the deps and was torn
down each second before firing. One clock now drives elapsed, drift, alarms and
the decision countdown.

**Question it answers:** does a live vitals monitor + chat-style decision feed
feel like an emergency simulation rather than an exam? The shipped run screen
(no `?variant=`) shows all six options at once and asks the candidate to
classify each — which reads as an exam rubric no matter how it's styled.

**Everything here is throwaway.** No tests, no persistence, no DB writes. The
sim state lives in memory and resets on reload. `prototypeCase.ts` hand-authors
consequences (vitals deltas + feed lines) that the real `CaseSpec` has no field
for — that schema change is the decision this prototype is meant to inform.

Still deterministic: every option carries authored consequences, no LLM. The
"live" feel comes from an authored drift toward a target, not from randomness —
so a given sequence of decisions always produces the same run.

When a variant wins: fold it into the real screen properly (with a real schema,
engine and tests), and move this directory + the switcher onto a throwaway
branch rather than leaving them in main.
