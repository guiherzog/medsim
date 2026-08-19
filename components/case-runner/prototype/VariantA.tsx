// PROTOTYPE — throwaway. See PROTOTYPE_README.md.
"use client";

import { Activity, ChevronRight, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatClock, useSimEngine } from "./useSimEngine";
import type { VitalKey } from "./prototypeCase";

export const VARIANT_A_NAME = "Monitor dominante";

const READINGS: { key: VitalKey; label: string; unit?: string }[] = [
  { key: "pa", label: "PA", unit: "mmHg" },
  { key: "fc", label: "FC", unit: "bpm" },
  { key: "spo2", label: "SpO₂", unit: "%" },
  { key: "fr", label: "FR", unit: "irpm" },
];

/** Big bedside monitor owns the screen; decisions slide up from the bottom. */
export function VariantA() {
  const { step, vitals, criticalVital, elapsed, feed, awaitingDecision, finished, choose } =
    useSimEngine();
  const lastOutcome = [...feed].reverse().find((f) => f.kind === "outcome" || f.kind === "event");
  const clip = [...feed].reverse().find((f) => f.kind === "clip");

  return (
    <div className="mx-auto flex min-h-[calc(100vh-96px)] w-full max-w-[520px] flex-col gap-4">
      {/* Monitor */}
      <div className="rounded-3xl bg-[#06121f] p-5 text-[#dbeafe] ring-1 ring-white/10">
        <div className="mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-mint">
            <Activity className="size-3.5 animate-pulse" />
            MONITOR · TEMPO REAL
          </span>
          <span className="font-mono text-sm tabular-nums text-[#8fb4d6]">
            {formatClock(elapsed)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {READINGS.map(({ key, label, unit }) => {
            const isCritical = criticalVital === key;
            return (
              <div
                key={key}
                className={cn(
                  "rounded-2xl px-4 py-3 transition-colors",
                  isCritical ? "bg-[#ff6b6b]/15 ring-1 ring-[#ff6b6b]/50" : "bg-white/5",
                )}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] tracking-[0.1em] text-[#8fb4d6]">
                    {label}
                  </span>
                  {unit && <span className="text-[10px] text-[#8fb4d6]/70">{unit}</span>}
                </div>
                <div
                  className={cn(
                    "font-heading text-[30px] font-extrabold leading-tight tabular-nums",
                    isCritical && "animate-pulse text-[#ff8a80]",
                  )}
                >
                  {vitals[key]}
                </div>
              </div>
            );
          })}
        </div>

        {criticalVital && (
          <p className="mt-3 animate-pulse font-mono text-[11px] tracking-[0.08em] text-[#ff8a80]">
            ⚠ VALOR CRÍTICO — INTERVENÇÃO IMEDIATA
          </p>
        )}
      </div>

      {/* Latest narration only — the log is secondary here */}
      {lastOutcome && (
        <p className="px-1 text-[15px] leading-relaxed text-muted-foreground">{lastOutcome.text}</p>
      )}
      {clip && (
        <button className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-left text-sm">
          <PlayCircle className="size-5 text-primary" />
          <span className="flex-1">{clip.text}</span>
          <span className="font-mono text-[10px] text-muted-foreground">MICROVÍDEO</span>
        </button>
      )}

      {/* Decision sheet */}
      <div className="mt-auto -mx-6 rounded-t-3xl bg-card px-6 pb-8 pt-4 shadow-[0_-14px_34px_-22px_rgba(13,59,102,0.55)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
        {finished ? (
          <p className="py-4 text-center font-heading font-bold">Caso encerrado.</p>
        ) : awaitingDecision ? (
          <>
            <p className="mb-3 font-heading font-bold">{step.prompt}</p>
            <div className="flex flex-col gap-2">
              {step.options.map((o) => (
                <button
                  key={o.id}
                  onClick={() => choose(o)}
                  className="flex items-center gap-2.5 rounded-[13px] border-[1.5px] border-[rgba(20,58,107,0.14)] bg-[#f7f9fc] px-4 py-3 text-left text-[15px] transition-colors hover:border-sky hover:bg-[#eef4ff]"
                >
                  <ChevronRight className="size-4 shrink-0 text-primary" />
                  {o.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="py-4 text-center font-mono text-xs tracking-[0.1em] text-muted-foreground">
            EVOLUINDO…
          </p>
        )}
      </div>
    </div>
  );
}
