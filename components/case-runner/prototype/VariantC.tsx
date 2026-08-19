// PROTOTYPE — throwaway. See PROTOTYPE_README.md.
"use client";

import { AlertTriangle, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatClock, useSimEngine } from "./useSimEngine";
import type { VitalKey } from "./prototypeCase";

export const VARIANT_C_NAME = "Cockpit dividido";

const READINGS: { key: VitalKey; label: string }[] = [
  { key: "pa", label: "PA" },
  { key: "fc", label: "FC" },
  { key: "spo2", label: "SpO₂" },
  { key: "fr", label: "FR" },
];

/**
 * Monitor and log are visible simultaneously and never move — the layout says
 * "you are watching a patient while you act", rather than paging through steps.
 * Decisions are inline in the log, where the situation is.
 */
export function VariantC() {
  const { step, vitals, criticalVital, elapsed, feed, awaitingDecision, finished, score, choose } =
    useSimEngine();

  return (
    <div className="mx-auto grid w-full max-w-[1100px] gap-4 md:grid-cols-[280px_1fr]">
      {/* Persistent monitor rail */}
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-2xl bg-[#06121f] p-4 text-[#dbeafe]">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-[0.12em] text-mint">MONITOR</span>
            <span className="font-mono text-xs tabular-nums text-[#8fb4d6]">
              {formatClock(elapsed)}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {READINGS.map(({ key, label }) => {
              const isCritical = criticalVital === key;
              return (
                <div
                  key={key}
                  className={cn(
                    "flex items-baseline justify-between rounded-lg px-2.5 py-1.5",
                    isCritical ? "bg-[#ff6b6b]/15 ring-1 ring-[#ff6b6b]/40" : "bg-white/5",
                  )}
                >
                  <span className="font-mono text-[10px] text-[#8fb4d6]">{label}</span>
                  <span
                    className={cn(
                      "font-heading text-lg font-extrabold tabular-nums",
                      isCritical && "animate-pulse text-[#ff8a80]",
                    )}
                  >
                    {vitals[key]}
                  </span>
                </div>
              );
            })}
          </div>
          {criticalVital && (
            <p className="mt-2.5 flex animate-pulse items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] text-[#ff8a80]">
              <AlertTriangle className="size-3" />
              CRÍTICO
            </p>
          )}
          <div className="mt-3 border-t border-white/10 pt-2.5 font-mono text-[10px] text-[#8fb4d6]">
            DECISÕES {score.total} · ACERTOS {score.correct} · GRAVES {score.criticalErrors}
          </div>
        </div>
      </aside>

      {/* Log with inline decisions */}
      <div className="flex flex-col gap-2.5">
        {feed.map((entry) => (
          <div
            key={entry.id}
            className={cn(
              "rounded-xl border-l-[3px] bg-card px-4 py-2.5 text-[15px] leading-relaxed",
              entry.kind === "event" && "border-l-sky",
              entry.kind === "decision" && "border-l-primary bg-secondary font-medium",
              entry.kind === "outcome" &&
                (entry.tone === "critical" ? "border-l-destructive" : "border-l-mint"),
              entry.kind === "clip" && "border-l-violet",
            )}
          >
            <span className="mr-2 font-mono text-[10px] tabular-nums text-muted-foreground">
              {formatClock(entry.at)}
            </span>
            {entry.kind === "clip" && <PlayCircle className="mr-1 inline size-4 text-violet" />}
            {entry.text}
          </div>
        ))}

        {finished ? (
          <p className="rounded-xl bg-card px-4 py-4 text-center font-heading font-bold">
            Caso encerrado.
          </p>
        ) : awaitingDecision ? (
          <div className="rounded-xl border-[1.5px] border-dashed border-primary/40 p-3">
            <p className="mb-2 font-mono text-[10px] tracking-[0.1em] text-muted-foreground">
              SUA DECISÃO
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {step.options.map((o) => (
                <button
                  key={o.id}
                  onClick={() => choose(o)}
                  className="rounded-lg border-[1.5px] border-[rgba(20,58,107,0.14)] bg-[#f7f9fc] px-3 py-2.5 text-left text-sm transition-colors hover:border-sky hover:bg-[#eef4ff]"
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="px-4 font-mono text-xs tracking-[0.1em] text-muted-foreground">
            <span className="animate-pulse">EVOLUINDO…</span>
          </p>
        )}
      </div>
    </div>
  );
}
