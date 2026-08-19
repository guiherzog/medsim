import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { EvolutionNarrative } from "@/components/case-runner/EvolutionNarrative";
import { VitalsPanel } from "@/components/case-runner/VitalsPanel";
import { EvolutionRunner } from "@/components/case-runner/EvolutionRunner";
import { createClient } from "@/lib/db/client";
import { getCaseById } from "@/lib/db/queries/cases";
import { getAttempt } from "@/lib/db/queries/attempts";
import { shuffleOptions } from "@/lib/engine/shuffle";
import { requireUser } from "@/lib/auth/session";

export default async function CaseRunPage({
  params,
}: {
  params: Promise<{ caseId: string; attemptId: string }>;
}) {
  const user = await requireUser();
  const { caseId: slug, attemptId } = await params;
  const t = await getTranslations("evolution");
  const supabase = await createClient();

  const attempt = await getAttempt(supabase, attemptId);
  if (!attempt || attempt.userId !== user.id) notFound();

  const caseRow = await getCaseById(supabase, attempt.caseId);
  if (!caseRow || caseRow.slug !== slug) notFound();

  if (attempt.status === "completed") {
    redirect(`/cases/${slug}/debrief/${attemptId}`);
  }

  const evolutionIndex = caseRow.caseSpec.evolutions.findIndex((e) => e.id === attempt.currentEvolutionId);
  const evolution = caseRow.caseSpec.evolutions[evolutionIndex];
  if (!evolution) notFound();

  const options = shuffleOptions(evolution, attemptId).map((o) => ({ id: o.id, text: o.text }));

  return (
    <>
      <AppHeader />
      <main>
        <AppShell>
        <p className="text-sm text-muted-foreground">
          {t("progress", { current: evolutionIndex + 1, total: caseRow.caseSpec.evolutions.length })}
        </p>
        <EvolutionNarrative narrative={evolution.narrative} />
        <VitalsPanel vitals={evolution.vitals} title={t("vitalsTitle")} />
        <EvolutionRunner
          key={evolution.id}
          attemptId={attemptId}
          evolutionId={evolution.id}
          caseSlug={slug}
          options={options}
        />
        </AppShell>
      </main>
    </>
  );
}
