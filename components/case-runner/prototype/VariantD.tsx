// PROTOTYPE — throwaway. See PROTOTYPE_README.md.
"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, ChevronRight, HeartCrack, Siren } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatClock, useSimEngine } from "./useSimEngine";
import { PrototypeDebrief } from "./PrototypeDebrief";
import { PrototypeBriefing } from "./PrototypeBriefing";
import { LogEntry } from "./LogEntry";
import { PROTOTYPE_BRIEFING, type VitalKey } from "./prototypeCase";
import { VitalTile } from "./VitalTile";
import { deltaFrom, patientStateOf, RANGES, severityOf } from "./vitalStatus";

export const VARIANT_D_NAME = "Monitor + log (escolhido)";

const KEYS: VitalKey[] = ["pa", "fc", "spo2", "fr"];

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
  const state = patientStateOf(vitals);
  const dying = state === "dying";

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
      {/* Desperate mode: the room closes in. Keyframes are local — throwaway. */}
      <style>{`
        @keyframes protoShake {
          0%,100% { transform: translate(0,0) }
          25% { transform: translate(-1.5px,1px) }
          75% { transform: translate(1.5px,-1px) }
        }
        @keyframes protoVignette {
          0%,100% { opacity: .35 }
          50% { opacity: .85 }
        }
      `}</style>
      {dying && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-40 [animation:protoVignette_1s_ease-in-out_infinite]"
          style={{
            boxShadow: "inset 0 0 60px 0 rgba(255,50,50,0.5)",
            background:
              "radial-gradient(ellipse at center, transparent 72%, rgba(255,40,40,0.14) 100%)",
          }}
        />
      )}
      {/* ── Monitor (pinned) ── */}
      <div
        className={cn(
          "shrink-0 rounded-3xl p-5 transition-colors duration-500",
          dying
            ? "bg-[#0a0608] text-[#ffe3e0] ring-2 ring-[#ff6b6b] [animation:protoShake_0.5s_ease-in-out_infinite]"
            : "bg-[#06121f] text-[#dbeafe] ring-1 ring-white/10",
        )}
      >
        <div className="mb-3.5 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span
                className={cn(
                  "absolute inline-flex size-full animate-ping rounded-full opacity-75",
                  dying ? "bg-[#ff6b6b]" : "bg-mint",
                )}
              />
              <span
                className={cn(
                  "relative inline-flex size-2 rounded-full",
                  dying ? "bg-[#ff6b6b]" : "bg-mint",
                )}
              />
            </span>
            <span
              className={cn(
                "font-mono text-[11px] tracking-[0.12em]",
                dying ? "text-[#ff8a80]" : "text-mint",
              )}
            >
              {dying ? "PACIENTE INSTÁVEL" : "AO VIVO"}
            </span>
          </span>
          <span className="flex items-center gap-1.5 font-mono text-sm tabular-nums text-[#8fb4d6]">
            <Activity className="size-3.5" />
            {formatClock(elapsed)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {KEYS.map((key) => (
            <VitalTile
              key={key}
              vitalKey={key}
              value={vitals[key]}
              severity={severityOf(key, vitals)}
              trend={trends[key]}
              delta={deltaFrom(PROTOTYPE_BRIEFING.admissionVitals, vitals, key)}
              isFocus={criticalVital === key}
            />
          ))}
        </div>

        {dying ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#ff6b6b] px-3 py-2.5">
            <HeartCrack className="size-5 shrink-0 animate-pulse text-white" />
            <span className="font-heading text-sm font-extrabold tracking-wide text-white">
              O PACIENTE ESTÁ MORRENDO — AJA AGORA
            </span>
          </div>
        ) : (
          criticalVital && (
            <div className="mt-3 flex animate-pulse items-center gap-2 rounded-xl bg-[#ff9d6b]/20 px-3 py-2 ring-1 ring-[#ff9d6b]/50">
              <Siren className="size-4 text-[#ffbe94]" />
              <span className="font-mono text-[11px] tracking-[0.08em] text-[#ffbe94]">
                {RANGES[criticalVital].label} FORA DA FAIXA — ATENÇÃO
              </span>
            </div>
          )
        )}
      </div>

      {/* ── Scrollable activity log ── */}
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto rounded-2xl bg-card/60 p-3 ring-1 ring-border transition-opacity duration-500",
          dying && "opacity-45",
        )}
      >
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
