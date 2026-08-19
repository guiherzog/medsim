import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { CaseRunner } from "@/components/case-runner/CaseRunner";
import { createClient } from "@/lib/db/client";
import { getCaseById } from "@/lib/db/queries/cases";
import { getAttempt } from "@/lib/db/queries/attempts";
import { requireUser } from "@/lib/auth/session";

export default async function CaseRunPage({
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

  if (attempt.status === "completed") {
    redirect(`/cases/${slug}/debrief/${attemptId}`);
  }

  // The full spec (including each option's consequences) goes to the client so
  // the monitor can react instantly — an accepted trade, see plan.md Phase 2.
  // Scoring is still recomputed server-side on every decision.
  return (
    <>
      <AppHeader />
      <main className="px-4 pb-3 sm:px-6 sm:pb-6">
        <CaseRunner caseSpec={caseRow.caseSpec} attemptId={attemptId} caseSlug={slug} />
      </main>
    </>
  );
}
