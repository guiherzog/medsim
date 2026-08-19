// PROTOTYPE — throwaway. See PROTOTYPE_README.md.
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  MoveDown,
  MoveUp,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatClock, useSimEngine, type Trend } from "./useSimEngine";
import { PrototypeDebrief } from "./PrototypeDebrief";
import { PrototypeBriefing } from "./PrototypeBriefing";
import { LogEntry } from "./LogEntry";
import type { VitalKey } from "./prototypeCase";

export const VARIANT_D_NAME = "Monitor + log (escolhido)";

const READINGS: { key: VitalKey; label: string; unit: string }[] = [
  { key: "pa", label: "PA", unit: "mmHg" },
  { key: "fc", label: "FC", unit: "bpm" },
  { key: "spo2", label: "SpO₂", unit: "%" },
  { key: "fr", label: "FR", unit: "irpm" },
];

function TrendIcon({ trend }: { trend: Trend }) {
  const Icon = trend === "up" ? MoveUp : trend === "down" ? MoveDown : Minus;
  return (
    <Icon
      className={cn(
        "size-3.5",
        trend === "flat" ? "text-[#8fb4d6]/50" : "text-[#8fb4d6]",
        trend !== "flat" && "animate-pulse",
      )}
    />
  );
}

/**
 * The chosen composition: monitor pinned at the top, scrollable timestamped
 * activity log in the middle, decisions docked at the bottom. Real-time is
 * stated loudly — AO VIVO pulse, trend arrows, and an explicit vitals-change
 * line in the log — rather than implied by a subtle caption.
 */
export function VariantD() {
  const [started, setStarted] = useState(false);
  const {
    step,
    vitals,
    remaining,
    trends,
    criticalVital,
    elapsed,
    feed,
    awaitingDecision,
    finished,
    score,
    clips,
    choose,
  } = useSimEngine();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [feed.length, awaitingDecision]);

  if (!started) {
    return <PrototypeBriefing onStart={() => setStarted(true)} />;
  }

  if (finished) {
    return (
      <PrototypeDebrief score={score} clips={clips} feed={feed} elapsed={elapsed} />
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-84px)] w-full max-w-[560px] flex-col gap-3">
      {/* ── Monitor (pinned) ── */}
      <div className="shrink-0 rounded-3xl bg-[#06121f] p-5 text-[#dbeafe] ring-1 ring-white/10">
        <div className="mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-mint" />
            </span>
            <span className="font-mono text-[11px] tracking-[0.12em] text-mint">AO VIVO</span>
          </span>
          <span className="flex items-center gap-1.5 font-mono text-sm tabular-nums text-[#8fb4d6]">
            <Activity className="size-3.5" />
            {formatClock(elapsed)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {READINGS.map(({ key, label, unit }) => {
            const isCritical = criticalVital === key;
            return (
              <div
                key={key}
                className={cn(
                  "rounded-2xl px-4 py-2.5 transition-colors duration-500",
                  isCritical
                    ? "bg-[#ff6b6b]/15 ring-1 ring-[#ff6b6b]/60"
                    : "bg-white/5 ring-1 ring-white/5",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-[0.1em] text-[#8fb4d6]">
                    {label}
                  </span>
                  <TrendIcon trend={trends[key]} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className={cn(
                      "font-heading text-[28px] font-extrabold leading-tight tabular-nums",
                      isCritical && "animate-pulse text-[#ff8a80]",
                    )}
                  >
                    {vitals[key]}
                  </span>
                  <span className="text-[10px] text-[#8fb4d6]/70">{unit}</span>
                </div>
              </div>
            );
          })}
        </div>

        {criticalVital && (
          <div className="mt-3 flex animate-pulse items-center gap-2 rounded-xl bg-[#ff6b6b]/20 px-3 py-2 ring-1 ring-[#ff6b6b]/50">
            <AlertTriangle className="size-4 text-[#ff8a80]" />
            <span className="font-mono text-[11px] tracking-[0.08em] text-[#ff8a80]">
              {READINGS.find((r) => r.key === criticalVital)?.label} CRÍTICA — AJA AGORA
            </span>
          </div>
        )}
      </div>

      {/* ── Scrollable activity log ── */}
      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-card/60 p-3 ring-1 ring-border">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
            REGISTRO DA CONDUÇÃO
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {score.total} decisões
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {feed.map((entry) => (
            <LogEntry key={entry.id} entry={entry} />
          ))}
          {!awaitingDecision && (
            <div className="flex items-center gap-2 px-3 py-1 font-mono text-[11px] tracking-[0.1em] text-muted-foreground">
              <span className="animate-pulse">▮</span> PACIENTE EVOLUINDO…
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* ── Decisions (docked) ── */}
      <div className="shrink-0">
        {awaitingDecision ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="font-heading text-[15px] font-bold">{step.prompt}</p>
              <span
                className={cn(
                  "shrink-0 rounded-md px-2 py-0.5 font-mono text-sm tabular-nums",
                  remaining <= 5
                    ? "animate-pulse bg-destructive text-white"
                    : remaining <= 10
                      ? "bg-[#ff9d6b]/25 text-[#8a4b18]"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {remaining}s
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full transition-all duration-1000 ease-linear",
                  remaining <= 5 ? "bg-destructive" : remaining <= 10 ? "bg-[#ff9d6b]" : "bg-sky",
                )}
                style={{ width: `${(remaining / step.decisionSeconds) * 100}%` }}
              />
            </div>
            {step.options.map((o) => (
              <button
                key={o.id}
                onClick={() => choose(o)}
                className="flex items-center gap-2.5 rounded-[13px] border-[1.5px] border-[rgba(20,58,107,0.14)] bg-card px-4 py-3 text-left text-[15px] transition-colors hover:border-sky hover:bg-[#eef4ff]"
              >
                <ChevronRight className="size-4 shrink-0 text-primary" />
                {o.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-[13px] border-[1.5px] border-dashed border-border py-3 text-center font-mono text-[11px] tracking-[0.1em] text-muted-foreground">
            AGUARDE A EVOLUÇÃO
          </div>
        )}
      </div>
    </div>
  );
}
