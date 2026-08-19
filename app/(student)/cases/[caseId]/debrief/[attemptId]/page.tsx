import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { buttonVariants } from "@/components/ui/button";
import { ScoreSummary } from "@/components/debrief/ScoreSummary";
import { EvolutionBreakdown } from "@/components/debrief/EvolutionBreakdown";
import { RationaleReview } from "@/components/debrief/RationaleReview";
import { OutcomeCallout } from "@/components/debrief/OutcomeCallout";
import { createClient } from "@/lib/db/client";
import { getCaseById } from "@/lib/db/queries/cases";
import { getAttempt } from "@/lib/db/queries/attempts";
import { requireUser } from "@/lib/auth/session";

export default async function DebriefPage({
  params,
}: {
  params: Promise<{ caseId: string; attemptId: string }>;
}) {
  const user = await requireUser();
  const { caseId: slug, attemptId } = await params;
  const t = await getTranslations("debrief");
  const supabase = await createClient();

  const attempt = await getAttempt(supabase, attemptId);
  if (!attempt || attempt.userId !== user.id) notFound();

  if (attempt.status !== "completed") {
    redirect(`/cases/${slug}/run/${attemptId}`);
  }

  const caseRow = await getCaseById(supabase, attempt.caseId);
  if (!caseRow || caseRow.slug !== slug) notFound();

  const evolutionById = new Map(caseRow.caseSpec.evolutions.map((e) => [e.id, e]));

  const allOptionResults = attempt.evolutionResults.flatMap((es) => es.optionResults);
  const totalCalls = allOptionResults.length;
  const correctCalls = allOptionResults.filter((r) => !r.wasMisclassified).length;
  const criticalMisses = attempt.evolutionResults.filter((es) => es.criticalWasMissed).map((es) => es.evolutionId);

  return (
    <>
      <AppHeader />
      <main>
        <AppShell>
          <DisclaimerBanner disclaimer={caseRow.disclaimer} />
          <ScoreSummary score={attempt.finalScore ?? 0} maxScore={attempt.maxPossibleScore ?? 0} />

          {/* The mocks pair the score with two callouts: what went well, and the
              critical failure point. Both are derived from evolution_results. */}
          <OutcomeCallout tone="good" title={t("whatWentWell")}>
            {t("whatWentWellBody", { count: correctCalls, total: totalCalls })}
          </OutcomeCallout>
          <OutcomeCallout tone={criticalMisses.length > 0 ? "bad" : "good"} title={t("criticalFailure")}>
            {criticalMisses.length > 0
              ? t("criticalFailureBody", { evolutions: criticalMisses.join(", ") })
              : t("allCriticalsFound")}
          </OutcomeCallout>

          <EvolutionBreakdown evolutionScores={attempt.evolutionResults} />
          <div className="flex flex-col gap-4">
            {attempt.evolutionResults.map((es) => {
              const evolution = evolutionById.get(es.evolutionId);
              if (!evolution) return null;
              return <RationaleReview key={es.evolutionId} evolution={evolution} evolutionScore={es} />;
            })}
          </div>
          <Link href="/cases" className={buttonVariants({ variant: "brand", size: "cta" })}>
            {t("backToCases")}
          </Link>
        </AppShell>
      </main>
    </>
  );
}
