# PROTOTYPE — real-time sim feel (throwaway)

Three variants of the case-run screen, switchable via `?variant=A|B|C` on the
existing `/cases/[caseId]/run/[attemptId]` route.

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
