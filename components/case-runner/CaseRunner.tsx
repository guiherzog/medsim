"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Monitor } from "./Monitor";
import { LogEntry } from "./LogEntry";
import { useRun } from "@/lib/sim/useRun";
import type { CaseSpec } from "@/lib/engine/types";

/**
 * The run screen: monitor pinned at the top, scrollable timestamped activity log
 * in the middle, decisions docked at the bottom — the composition validated in
 * the prototype (branch prototype/realtime-sim).
 */
export function CaseRunner({
  caseSpec,
  attemptId,
  caseSlug,
}: {
  caseSpec: CaseSpec;
  attemptId: string;
  caseSlug: string;
}) {
  const t = useTranslations("run");
  const router = useRouter();
  const {
    step,
    vitals,
    trends,
    criticalVital,
    patientState,
    elapsed,
    remaining,
    log,
    awaitingDecision,
    finished,
    error,
    choose,
  } = useRun({ caseSpec, attemptId });
  const endRef = useRef<HTMLDivElement>(null);
  const dying = patientState === "dying";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [log.length, awaitingDecision]);

  useEffect(() => {
    if (finished) router.push(`/cases/${caseSlug}/debrief/${attemptId}`);
  }, [finished, router, caseSlug, attemptId]);

  const decisionsTaken = log.filter((l) => l.kind === "decision" || l.kind === "timeout").length;

  return (
    <div className="mx-auto flex h-[calc(100dvh-76px)] w-full max-w-[560px] flex-col gap-2 sm:gap-3">
      <style>{`
        @keyframes simShake {
          0%,100% { transform: translate(0,0) }
          25% { transform: translate(-1.5px,1px) }
          75% { transform: translate(1.5px,-1px) }
        }
        @keyframes simVignette {
          0%,100% { opacity: .35 }
          50% { opacity: .85 }
        }
      `}</style>

      {/* Desperate mode: the room closes in, edges only so the monitor stays readable. */}
      {dying && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-40 [animation:simVignette_1s_ease-in-out_infinite]"
          style={{
            boxShadow: "inset 0 0 60px 0 rgba(255,50,50,0.5)",
            background:
              "radial-gradient(ellipse at center, transparent 72%, rgba(255,40,40,0.14) 100%)",
          }}
        />
      )}

      <Monitor
        vitals={vitals}
        admissionVitals={caseSpec.briefing.admissionVitals}
        trends={trends}
        criticalVital={criticalVital}
        patientState={patientState}
        elapsed={elapsed}
      />

      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto rounded-2xl bg-card/60 p-2 ring-1 ring-border transition-opacity duration-500 sm:p-3",
          dying && "opacity-45",
        )}
      >
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
            {t("logTitle")}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {t("decisions", { count: decisionsTaken })}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {log.map((item) => (
            <LogEntry key={item.id} item={item} />
          ))}
          {!awaitingDecision && !finished && (
            <div className="flex items-center gap-2 px-3 py-1 font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
              <span className="animate-pulse">▮</span> {t("evolving")}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="shrink-0">
        {error && (
          <p className="mb-2 text-sm text-destructive" role="alert">
            {t("error")}
          </p>
        )}
        {awaitingDecision ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="font-heading text-sm leading-snug font-bold sm:text-[15px]">{step.prompt}</p>
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
                {t("seconds", { seconds: remaining })}
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
            {step.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => choose(option)}
                className="flex items-center gap-2 rounded-xl border border-[rgba(20,58,107,0.16)] bg-card px-3 py-2 text-left text-[13.5px] leading-snug transition-colors hover:border-sky hover:bg-[#eef4ff] sm:gap-2.5 sm:px-4 sm:py-2.5 sm:text-[15px]"
              >
                <ChevronRight className="size-3.5 shrink-0 text-primary sm:size-4" />
                {option.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-[13px] border-[1.5px] border-dashed border-border py-3 text-center font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
            {t("waiting")}
          </div>
        )}
      </div>
    </div>
  );
}
