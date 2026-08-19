// PROTOTYPE — throwaway. See PROTOTYPE_README.md.
"use client";

import {
  Activity,
  BellRing,
  HeartPulse,
  PlayCircle,
  Siren,
  Stethoscope,
  TimerOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatClock, type FeedEntry, type FeedKind } from "./useSimEngine";

/**
 * Every entry kind gets its own identity — icon, label and treatment — so the
 * log reads as a stream of distinguishable events rather than one card style
 * repeated with a different border colour.
 */
const KINDS: Record<
  FeedKind,
  { label: string; Icon: typeof Siren; wrap: string; chip: string; body?: string }
> = {
  event: {
    label: "Evento",
    Icon: Siren,
    wrap: "border-l-sky bg-[#0d1f45] text-deep-foreground",
    chip: "bg-sky/20 text-[#bfe0ff]",
    body: "font-medium",
  },
  decision: {
    label: "Sua conduta",
    Icon: Stethoscope,
    wrap: "border-l-primary bg-secondary",
    chip: "bg-primary text-primary-foreground",
    body: "font-medium",
  },
  outcome: {
    label: "Resposta do paciente",
    Icon: HeartPulse,
    wrap: "border-l-mint bg-card",
    chip: "bg-mint/20 text-[#0d7f72]",
  },
  vitals: {
    label: "Vitais",
    Icon: Activity,
    wrap: "border-l-muted-foreground/40 bg-muted/40",
    chip: "bg-foreground/10 text-muted-foreground",
    body: "font-mono text-[13px] tabular-nums",
  },
  alarm: {
    label: "Alarme",
    Icon: BellRing,
    wrap: "border-l-destructive bg-destructive/10",
    chip: "bg-destructive text-white",
    body: "font-mono text-[13px] font-bold uppercase tracking-wide text-destructive",
  },
  timeout: {
    label: "Tempo esgotado",
    Icon: TimerOff,
    wrap: "border-l-[#ff9d6b] bg-[#ff9d6b]/12",
    chip: "bg-[#ff9d6b] text-[#3d1d00]",
    body: "text-[#8a4b18]",
  },
  clip: {
    label: "Microvídeo",
    Icon: PlayCircle,
    wrap: "border-l-violet bg-violet/8",
    chip: "bg-violet/20 text-[#5b4bd6]",
  },
};

export function LogEntry({ entry, dim = false }: { entry: FeedEntry; dim?: boolean }) {
  const kind = KINDS[entry.kind];
  const { Icon } = kind;
  // A critical outcome borrows the destructive treatment — the patient got worse.
  const isBadOutcome = entry.kind === "outcome" && entry.tone === "critical";

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl border-l-[3px] px-3 py-2",
        kind.wrap,
        isBadOutcome && "border-l-destructive bg-destructive/10",
        dim && "opacity-90",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] tracking-[0.1em] uppercase",
            kind.chip,
            isBadOutcome && "bg-destructive text-white",
          )}
        >
          <Icon className="size-3" />
          {kind.label}
        </span>
        <span
          className={cn(
            "ml-auto font-mono text-[10px] tabular-nums",
            entry.kind === "event" ? "text-deep-muted" : "text-muted-foreground",
          )}
        >
          {formatClock(entry.at)}
        </span>
      </div>
      <p className={cn("text-sm leading-relaxed", kind.body, isBadOutcome && "text-destructive")}>
        {entry.text}
      </p>
    </div>
  );
}
