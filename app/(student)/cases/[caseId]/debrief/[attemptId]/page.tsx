import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { RunDebrief } from "@/components/debrief/RunDebrief";
import { createClient } from "@/lib/db/client";
import { getCaseById } from "@/lib/db/queries/cases";
import { getAttempt } from "@/lib/db/queries/attempts";
import { scoreRun } from "@/lib/engine/scoreRun";
import { requireUser } from "@/lib/auth/session";

export default async function DebriefPage({
  params,
}: {
  params: Promise<{ caseId: string; attemptId: string }>;
}) {
  const user = await requireUser();
  const { caseId: slug, attemptId } = await params;
  const supabase = await createClient();

  const attempt = await getAttempt(supabase, attemptId);
  if (!attempt || attempt.userId !== user.id) notFound();

  const caseRow = await getCaseById(supabase, attempt.caseId);
  if (!caseRow || caseRow.slug !== slug) notFound();

  if (attempt.status !== "completed") {
    redirect(`/cases/${slug}/run/${attemptId}`);
  }

  const score = scoreRun(caseRow.caseSpec, attempt.decisions);

  return (
    <>
      <AppHeader />
      <main>
        <AppShell>
          <RunDebrief
            caseSpec={caseRow.caseSpec}
            score={score}
            decisions={attempt.decisions}
            slug={slug}
          />
        </AppShell>
      </main>
    </>
  );
}
