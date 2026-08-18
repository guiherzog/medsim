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
│   ├── AppHeader.tsx
│   ├── DisclaimerBanner.tsx      # renders case.disclaimer via Alert; persistent per plan.md
│   └── StatusBadge.tsx           # case.status -> label + color (under_review/reviewed/draft/disabled)
├── case-runner/   # feature components for the case-play flow, composed from ui/
│   ├── CaseCard.tsx              # one card on the case-list screen (Card + StatusBadge + category Badge)
│   ├── VitalsPanel.tsx           # renders pa/fc/spo2; null = "—", never carried forward (plan.md Q4)
│   ├── InitialConductTimer.tsx   # hard-gated countdown; reveal disabled until 0 (Q8); textarea -> initial_conduct_text (Q3)
│   ├── EvolutionNarrative.tsx    # narrative text block for one evolution
│   ├── OptionRow.tsx             # one of the 6 options: correct/incorrect call + "most dangerous" pick, unrestricted (Q6)
│   ├── OptionList.tsx            # composes 6 OptionRows + submit button
│   └── EvolutionScoreFeedback.tsx # immediate per-evolution score after submit
└── debrief/
    ├── ScoreSummary.tsx          # total / max score
    ├── EvolutionBreakdown.tsx    # per-evolution score + critical-miss flag
    └── RationaleReview.tsx       # all 6 options' rationale shown, correct/incorrect/critical marked (Q5)
```

## The rule

If a piece of markup appears a second time, or carries semantic meaning (a status, a score, an option, a vitals reading), it becomes a component under the right folder **before** the third usage — not after. No inline `<div className="...">` reimplementing something `components/ui/` or `components/case-runner/` already has. When in doubt about where something belongs: `ui/` = no domain knowledge (would make sense in any app), `layout/` = knows about cases/status but not about the play flow, `case-runner/`/`debrief/` = knows about evolutions/scoring specifically.

## Design tokens (Tailwind theme extension / shadcn CSS vars)

| Token | Use |
|---|---|
| `--primary` | clinical blue — primary actions, links |
| `--destructive` | incorrect option, critical-error flag |
| `--success` | correct option, "reviewed" status |
| `--warning` | "under_review" status badge |
| `--muted` | metadata, secondary text, disabled/draft (never shown to students) |

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
