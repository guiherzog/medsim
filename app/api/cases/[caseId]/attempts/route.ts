import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getPlayableCaseBySlug } from "@/lib/db/queries/cases";
import { createAttempt } from "@/lib/db/queries/attempts";

/** Starts a run. The reflection gate is gone (plan.md Phase 2), so there is no body to read. */
export async function POST(_request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId: slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const caseRow = await getPlayableCaseBySlug(supabase, slug);
  if (!caseRow) return NextResponse.json({ error: "case not found" }, { status: 404 });

  const firstStep = caseRow.caseSpec.steps[0];
  const attempt = await createAttempt(supabase, {
    caseId: caseRow.id,
    userId: user.id,
    firstStepId: firstStep.id,
  });

  return NextResponse.json({ attemptId: attempt.id, firstStepId: firstStep.id });
}
