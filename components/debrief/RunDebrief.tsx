import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { DeepPanel } from "@/components/layout/DeepPanel";
import { Eyebrow } from "@/components/layout/Eyebrow";
import { OutcomeCallout } from "./OutcomeCallout";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/format";
import type { CaseSpec, RecordedDecision, RunScore } from "@/lib/engine/types";

/**
 * The debriefing: score ring, what-went-well / critical-failure callouts, the
 * microvídeos earned, and the run replayed as its own timeline with the
 * rationale for each decision — the conduction log, not an answer key.
 */
export async function RunDebrief({
  caseSpec,
  score,
  decisions,
  slug,
}: {
  caseSpec: CaseSpec;
  score: RunScore;
  decisions: RecordedDecision[];
  slug: string;
}) {
  const t = await getTranslations("debrief");
  const stepById = new Map(caseSpec.steps.map((s) => [s.id, s]));
  const survived = score.criticalErrors === 0 && score.timeouts === 0;
  const pct = score.maxScore > 0 ? Math.round((score.score / score.maxScore) * 100) : 0;
  const elapsed = decisions.length > 0 ? decisions[decisions.length - 1].at : 0;

  const clips = score.results
    .map((r) => stepById.get(r.stepId)?.options.find((o) => o.id === r.optionId)?.clip)
    .filter((c): c is string => Boolean(c));

  const failureParts = [
    score.criticalErrors > 0 && t("criticalErrors", { count: score.criticalErrors }),
    score.timeouts > 0 && t("timeouts", { count: score.timeouts }),
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
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
            <span className="font-heading text-[30px] font-extrabold leading-none">
              {score.score}
            </span>
            <span className="text-[11px] text-deep-muted">/{score.maxScore}</span>
          </div>
        </div>
        <div>
          <Eyebrow className="text-deep-muted">{t("title")}</Eyebrow>
          <p className="mt-1 font-heading text-xl font-bold">
            {survived ? t("stabilised") : t("compromised")}
          </p>
          <p className="mt-1 text-sm text-deep-muted">
            {t("summary", {
              time: formatClock(elapsed),
              correct: score.correct,
              total: score.total,
            })}
          </p>
        </div>
      </DeepPanel>

      <OutcomeCallout tone="good" title={t("whatWentWell")}>
        {score.correct > 0
          ? t("whatWentWellBody", { correct: score.correct, total: score.total })
          : t("whatWentWellNone")}
      </OutcomeCallout>

      <OutcomeCallout tone={survived ? "good" : "bad"} title={t("criticalFailure")}>
        {survived ? t("criticalNone") : failureParts.join(" ")}
      </OutcomeCallout>

      {clips.length > 0 && (
        <div className="flex flex-col gap-2">
          <Eyebrow className="text-muted-foreground">{t("clips")}</Eyebrow>
          {clips.map((clip) => (
            <div
              key={clip}
              className="flex items-center gap-2.5 rounded-2xl bg-secondary px-4 py-3 text-sm"
            >
              <PlayCircle className="size-5 text-primary" />
              <span className="flex-1">{clip}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {t("clipDuration")}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Eyebrow className="text-muted-foreground">{t("howYouRan")}</Eyebrow>
        <div className="flex flex-col gap-2 rounded-2xl bg-card/60 p-3 ring-1 ring-border">
          {score.results.map((result) => {
            const step = stepById.get(result.stepId);
            const option = step?.options.find((o) => o.id === result.optionId);
            return (
              <div
                key={result.stepId}
                className={cn(
                  "flex flex-col gap-1 rounded-xl border-l-[3px] bg-card px-3 py-2",
                  result.correct
                    ? "border-l-mint"
                    : result.timedOut
                      ? "border-l-[#ff9d6b]"
                      : "border-l-destructive",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                    {step?.id}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[9px] tracking-[0.1em] uppercase",
                      result.correct
                        ? "text-[#0d7f72]"
                        : result.timedOut
                          ? "text-[#8a4b18]"
                          : "text-destructive",
                    )}
                  >
                    {result.points > 0 ? `+${result.points}` : result.points}
                  </span>
                </div>
                <p className="text-sm font-medium">
                  {option ? option.label : step?.timeout.feed}
                </p>
                {option && (
                  <p className="text-sm text-muted-foreground">{option.rationale}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Link href={`/cases/${slug}`} className={buttonVariants({ variant: "brand", size: "cta" })}>
          {t("retry")}
        </Link>
        <Link
          href="/cases"
          className={buttonVariants({ variant: "outline", size: "cta", className: "text-base" })}
        >
          {t("backToCases")}
        </Link>
      </div>
    </div>
  );
}
