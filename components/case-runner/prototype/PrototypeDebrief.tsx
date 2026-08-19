// PROTOTYPE — throwaway. See PROTOTYPE_README.md.
"use client";

import { PlayCircle, RotateCcw } from "lucide-react";
import { DeepPanel } from "@/components/layout/DeepPanel";
import { Eyebrow } from "@/components/layout/Eyebrow";
import { OutcomeCallout } from "@/components/debrief/OutcomeCallout";
import { Button } from "@/components/ui/button";
import { formatClock, type FeedEntry, type SimScore } from "./useSimEngine";
import { LogEntry } from "./LogEntry";

/**
 * The mocks' "DEBRIEFING DO CASO": a score ring, what-went-well / critical
 * failure callouts, the microvídeos earned, and the full timestamped run so the
 * candidate can replay their own reasoning — the conduction log, not an
 * exam-style answer key.
 */
export function PrototypeDebrief({
  score,
  clips,
  feed,
  elapsed,
}: {
  score: SimScore;
  clips: string[];
  feed: FeedEntry[];
  elapsed: number;
}) {
  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  const survived = score.criticalErrors === 0 && score.timeouts === 0;

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-4">
      <DeepPanel className="flex items-center gap-5">
        <div
          className="relative flex size-[104px] shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(${
              survived ? "var(--mint)" : "#ff6b6b"
            } 0% ${pct}%, rgba(255,255,255,0.1) ${pct}% 100%)`,
          }}
        >
          <div className="absolute flex size-[78px] flex-col items-center justify-center rounded-full bg-[#122250]">
            <span className="font-heading text-[30px] font-extrabold leading-none">{pct}</span>
            <span className="text-[11px] text-deep-muted">/100</span>
          </div>
        </div>
        <div>
          <Eyebrow className="text-deep-muted">Debriefing do caso</Eyebrow>
          <p className="mt-1 font-heading text-xl font-bold">
            {survived ? "Paciente estabilizado" : "Desfecho comprometido"}
          </p>
          <p className="mt-1 text-sm text-deep-muted">
            Conduzido em {formatClock(elapsed)} · {score.correct} de {score.total} decisões corretas
          </p>
        </div>
      </DeepPanel>

      <OutcomeCallout tone="good" title="O que foi bem">
        {score.correct > 0
          ? `${score.correct} de ${score.total} condutas alinhadas com a referência.`
          : "Nenhuma conduta alinhada com a referência neste caso."}
      </OutcomeCallout>

      <OutcomeCallout
        tone={score.criticalErrors > 0 || score.timeouts > 0 ? "bad" : "good"}
        title="Ponto crítico de falha"
      >
        {score.criticalErrors === 0 && score.timeouts === 0
          ? "Nenhum erro crítico e nenhuma decisão perdida por tempo."
          : [
              score.criticalErrors > 0 &&
                `${score.criticalErrors} erro(s) crítico(s) — decisões que pioraram diretamente o quadro.`,
              score.timeouts > 0 &&
                `${score.timeouts} decisão(ões) perdida(s) por tempo — a demora também tem consequência.`,
            ]
              .filter(Boolean)
              .join(" ")}
      </OutcomeCallout>

      {clips.length > 0 && (
        <div className="flex flex-col gap-2">
          <Eyebrow className="text-muted-foreground">Microvídeos para revisar</Eyebrow>
          {clips.map((c) => (
            <button
              key={c}
              className="flex items-center gap-2.5 rounded-2xl bg-secondary px-4 py-3 text-left text-sm"
            >
              <PlayCircle className="size-5 text-primary" />
              <span className="flex-1">{c}</span>
              <span className="font-mono text-[10px] text-muted-foreground">3 MIN</span>
            </button>
          ))}
        </div>
      )}

      {/* The run itself, replayable — the point the exam-style summary missed. */}
      <div className="flex flex-col gap-2">
        <Eyebrow className="text-muted-foreground">Como você conduziu</Eyebrow>
        <div className="flex flex-col gap-1.5 rounded-2xl bg-card/60 p-3 ring-1 ring-border">
          {feed.map((e) => (
            <LogEntry key={e.id} entry={e} dim />
          ))}
        </div>
      </div>

      <Button
        type="button"
        variant="brand"
        size="cta"
        onClick={() => window.location.reload()}
        className="mt-1"
      >
        <RotateCcw className="size-4" />
        Refazer o caso
      </Button>
    </div>
  );
}
