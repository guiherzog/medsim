// PROTOTYPE — throwaway. See PROTOTYPE_README.md.
"use client";

import { useEffect, useRef } from "react";
import { PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatClock, useSimEngine } from "./useSimEngine";
import type { VitalKey } from "./prototypeCase";

export const VARIANT_B_NAME = "Feed de conversa";

const READINGS: { key: VitalKey; label: string }[] = [
  { key: "pa", label: "PA" },
  { key: "fc", label: "FC" },
  { key: "spo2", label: "SpO₂" },
  { key: "fr", label: "FR" },
];

/**
 * The transcript is the product: the case reads as a conversation you're having
 * with the patient's course. Vitals are a thin always-visible strip, decisions
 * are reply chips at the bottom.
 */
export function VariantB() {
  const { step, vitals, criticalVital, elapsed, feed, awaitingDecision, finished, choose } =
    useSimEngine();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [feed.length, awaitingDecision]);

  return (
    <div className="mx-auto flex w-full max-w-[520px] flex-col gap-3">
      {/* Slim sticky vitals strip */}
      <div className="sticky top-0 z-10 -mx-6 flex items-center gap-3 border-b border-border bg-app/95 px-6 py-2.5 backdrop-blur">
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {formatClock(elapsed)}
        </span>
        <div className="flex flex-1 justify-between gap-2">
          {READINGS.map(({ key, label }) => {
            const isCritical = criticalVital === key;
            return (
              <span
                key={key}
                className={cn(
                  "flex items-baseline gap-1 rounded-md px-1.5 py-0.5 text-sm tabular-nums",
                  isCritical && "animate-pulse bg-destructive/12 font-bold text-destructive",
                )}
              >
                <span className="font-mono text-[10px] text-muted-foreground">{label}</span>
                {vitals[key]}
              </span>
            );
          })}
        </div>
      </div>

      {/* Transcript */}
      <div className="flex flex-col gap-3 pb-2">
        {feed.map((entry) => {
          if (entry.kind === "decision") {
            return (
              <div key={entry.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-[15px] text-primary-foreground">
                  {entry.text}
                </div>
              </div>
            );
          }
          if (entry.kind === "clip") {
            return (
              <button
                key={entry.id}
                className="flex items-center gap-2 self-start rounded-2xl bg-secondary px-4 py-2.5 text-left text-sm"
              >
                <PlayCircle className="size-4 text-primary" />
                {entry.text}
              </button>
            );
          }
          return (
            <div key={entry.id} className="flex">
              <div
                className={cn(
                  "max-w-[88%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-[15px] leading-relaxed",
                  entry.tone === "critical"
                    ? "bg-destructive/10 text-destructive"
                    : entry.kind === "event"
                      ? "bg-[#0d1f45] text-deep-foreground"
                      : "bg-card ring-1 ring-border",
                )}
              >
                {entry.text}
              </div>
            </div>
          );
        })}
        {!awaitingDecision && !finished && (
          <span className="self-start px-2 font-mono text-xs tracking-[0.1em] text-muted-foreground">
            <span className="animate-pulse">● ● ●</span>
          </span>
        )}
        <div ref={endRef} />
      </div>

      {/* Reply chips */}
      {finished ? (
        <p className="py-3 text-center font-heading font-bold">Caso encerrado.</p>
      ) : (
        awaitingDecision && (
          <div className="sticky bottom-0 -mx-6 flex flex-col gap-2 border-t border-border bg-app/95 px-6 py-3 backdrop-blur">
            <p className="text-xs text-muted-foreground">{step.prompt}</p>
            {step.options.map((o) => (
              <button
                key={o.id}
                onClick={() => choose(o)}
                className="self-end rounded-2xl rounded-br-sm border-[1.5px] border-primary/30 bg-card px-4 py-2.5 text-right text-[15px] transition-colors hover:border-primary hover:bg-secondary"
              >
                {o.label}
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}
