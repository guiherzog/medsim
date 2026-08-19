# MedSim — Design System & Component Reference

Companion to `plan.md`. `plan.md` owns phases/decisions; this file owns UI conventions — the doc to open while building a screen. Keep it in sync as components get built (mark items ✅ when real, not just planned).

## Stack

- **Tailwind CSS** for styling.
- **shadcn/ui** for primitives — generated as real files into `components/ui/`, not an npm black box. You own, read, and edit every line. Gives Radix's accessibility/keyboard behavior for free (focus traps, ARIA roles) without hand-building it.
- **next-intl** for all UI copy — no hardcoded strings in any component (`plan.md`'s i18n section). Case content (narrative/options/rationale) is authored data passed as props, never baked into JSX.

## Folder structure

```
components/
├── ui/            # shadcn/ui primitives — generated, not hand-written. Button, Card, Badge,
│                  # Checkbox, RadioGroup, Progress, Separator, Dialog, Skeleton, Alert, Toast.
├── layout/        # shared chrome used on every case screen
│   ├── AppShell.tsx              # the mocks' 520px mobile column — every screen sits in this
│   ├── AppHeader.tsx             # brand mark (IconTile) + wordmark
│   ├── DeepPanel.tsx             # deep navy gradient surface w/ mint glow (hero, score panel)
│   ├── IconTile.tsx              # rounded tinted icon square (tones: brand/mint/sky/violet/danger)
│   ├── Eyebrow.tsx               # small uppercase mono label ("SINAIS VITAIS ATUALIZADOS")
│   ├── ProtocolReferences.tsx    # home-page selling point: the reference protocols behind the cases
│   └── StatusBadge.tsx           # case.status -> label + color (under_review/reviewed/draft/disabled)
├── case-runner/   # feature components for the case-play flow, composed from ui/
│   ├── CaseCard.tsx              # one card on the case-list screen
│   ├── CaseIntro.tsx             # the briefing: patient card, admission vitals, "Assumir o caso"
│   ├── CaseRunner.tsx            # the run screen: monitor + activity log + decisions (client)
│   ├── Monitor.tsx               # bedside monitor; near-black + ring + shake when dying
│   ├── VitalTile.tsx             # one reading: severity colour, chip, delta, reference band
│   └── LogEntry.tsx              # one activity-log entry, styled per kind
└── debrief/
    ├── RunDebrief.tsx            # score ring, callouts, microvídeos, the run replayed w/ rationale
    └── OutcomeCallout.tsx        # "O que foi bem" / "Ponto crítico de falha"
```

## Buttons

`components/ui/button.tsx` carries two additions matching the mocks, on top of shadcn's variants:

- `variant="brand"` — the mint→sky gradient CTA with dark navy text and display type.
- `size="cta"` — the full-width 16px-radius primary action.

Every screen's main forward action (`Ver evolução`, `Confirmar respostas`, `Próxima evolução`) uses `variant="brand" size="cta"`.

## The rule

If a piece of markup appears a second time, or carries semantic meaning (a status, a score, an option, a vitals reading), it becomes a component under the right folder **before** the third usage — not after. No inline `<div className="...">` reimplementing something `components/ui/` or `components/case-runner/` already has. When in doubt about where something belongs: `ui/` = no domain knowledge (would make sense in any app), `layout/` = knows about cases/status but not about the play flow, `case-runner/`/`debrief/` = knows about evolutions/scoring specifically.

## Design tokens

Taken from the MedSim design mocks (the "MedSim AI data briefing" artifact), defined in `app/globals.css`.

> **The mocks cover more product than this app builds, on purpose.** They also show onboarding (career stage, focus area), a dashboard with a readiness index, per-category mastery, gap analysis and streaks. Those are out of scope per `plan.md`'s "Explicitly not in this pass" — the mocks are the source for the *visual language*, not a checklist of screens to build. Don't treat their absence as a gap.

**Type** — three faces, loaded via `next/font/google` in `app/layout.tsx`:

| Role | Family | Tailwind |
|---|---|---|
| Display / headings | Hanken Grotesk (700/800) | `font-heading` |
| Body | Source Sans 3 | `font-sans` (default) |
| Eyebrow labels | IBM Plex Mono (500/600) | `font-mono` |

`h1`–`h3` get `font-heading` automatically from the base layer.

**Colour**

| Token | Value | Use |
|---|---|---|
| `--app` | `#f5f7fc` | page ground (the shell's background, not `--background`) |
| `--foreground` | `#0d1b2a` | body text |
| `--muted-foreground` | `#5b6b7d` | secondary text, eyebrow labels |
| `--primary` | `#2b6fc4` | links, non-gradient primary |
| `--mint` / `--sky` / `--violet` | `#38e2c5` / `#4aa3ff` / `#8b7bff` | gradients, icon tiles, score ring |
| `--deep` + `--deep-foreground` | `#0d1f45` on `#eaf1fb` | deep navy display surfaces |
| `--deep-muted` | `#8fb4d6` | secondary text on deep surfaces |
| `--destructive` | `#d1483c` | incorrect option, critical-error flag |

**Radii** — the mocks are generous: `--radius: 1rem`, with `rounded-3xl` heroes, `rounded-2xl` cards/CTAs, `9px`/`13px` icon tiles.

**Layout** — the mocks are mobile-first: one centred column capped at **520px**. Always use `AppShell`, never a bare `max-w-*` container.

**Case-screen patterns** (Phase 2): a briefing leads with a mono eyebrow (category) + status badge, then a 28px display title, the patient in a hatched-avatar card and admission vitals on the deep navy panel. The run screen pins `Monitor` at the top, scrolls the activity log in the middle, and docks the decisions — each with a countdown that escalates grey → amber → pulsing red. The debrief pairs the score ring with the two `OutcomeCallout`s and replays the run with each decision's rationale.

**Severity is a system, not a one-off.** `lib/engine/vitalStatus.ts` owns the reference bands; `VitalTile` renders `normal` / `warning` / `critical` with its own colour, chip, delta-from-admission and band. A patient state of `dying` escalates the whole screen (red ring, shake, banner, edge vignette, log dimmed) — but the monitor panel stays near-black, because tinting it red flattens the per-vital severity colours that make the readings legible.

**Log entries are typed.** Each kind (`event`, `decision`, `outcome`, `vitals`, `alarm`, `timeout`, `clip`) gets its own icon, uppercase mono chip and treatment in `LogEntry`, so the log scans as a stream of different things happening.

Where the mocks describe behaviour this app deliberately doesn't have — a real-time monitor whose vitals shift per decision, microvídeos, the paywall — the *visual* pattern is copied but the copy is rewritten to describe what actually happens. Never ship mock copy that misdescribes the app.

## Status badge mapping (`StatusBadge`)

| `cases.status` | Label (pt-BR) | Color |
|---|---|---|
| `reviewed` | "Revisado por especialista" | success |
| `under_review` | "Em validação" | warning |
| `draft` / `disabled` | — (never rendered to students; reserved for future admin UI) | muted |

## Reuse checklist before writing a new component

1. Does `components/ui/` already have the shadcn primitive for this? Use it, don't hand-roll a button/card/badge/checkbox.
2. Does `components/case-runner/` or `components/debrief/` already have this composed shape? Reuse/extend it, don't fork a near-duplicate.
3. Is the text hardcoded anywhere in this component? Move it to `messages/pt-BR.json` + `useTranslations()`.
4. Is case content (narrative/options/rationale) passed as a prop, or typed directly into JSX? It must be a prop — the component renders any `CaseSpec`, not one specific case.
