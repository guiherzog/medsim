import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getAttempt } from "@/lib/db/queries/attempts";
import { scoreRun } from "@/lib/engine/scoreRun";
import type { CaseSpec } from "@/lib/engine/types";

export async function GET(_request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
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

  const { data: caseRow } = await supabase
    .from("cases")
    .select("case_spec")
    .eq("id", attempt.caseId)
    .single();
  if (!caseRow) return NextResponse.json({ error: "case not found" }, { status: 404 });

  return NextResponse.json({
    status: attempt.status,
    ...scoreRun(caseRow.case_spec as CaseSpec, attempt.decisions),
    decisions: attempt.decisions,
  });
}
