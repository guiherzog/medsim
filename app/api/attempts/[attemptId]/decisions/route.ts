import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getAttempt, recordDecision } from "@/lib/db/queries/attempts";
import type { CaseSpec } from "@/lib/engine/types";

/**
 * Records one decision. The client sends only which option it picked (or that
 * the clock expired); the score is recomputed server-side from the DB's own
 * case_spec, so the answer key being visible to the client can't inflate a score.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const { attemptId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const attempt = await getAttempt(supabase, attemptId);
  if (!attempt || attempt.userId !== user.id) {
    return NextResponse.json({ error: "attempt not found" }, { status: 404 });
  }
  if (attempt.status === "completed") {
    return NextResponse.json({ error: "attempt already completed" }, { status: 409 });
  }

  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .select("case_spec")
    .eq("id", attempt.caseId)
    .single();
  if (caseError || !caseRow) {
    return NextResponse.json({ error: "case not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.stepId !== "string" || typeof body.at !== "number") {
    return NextResponse.json({ error: "invalid submission" }, { status: 400 });
  }

  try {
    const result = await recordDecision(supabase, {
      attempt,
      caseSpec: caseRow.case_spec as CaseSpec,
      stepId: body.stepId,
      optionId: typeof body.optionId === "string" ? body.optionId : null,
      timedOut: body.timedOut === true,
      at: Math.max(0, Math.round(body.at)),
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
