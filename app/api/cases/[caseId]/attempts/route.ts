import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getPlayableCaseBySlug } from "@/lib/db/queries/cases";
import { createAttempt } from "@/lib/db/queries/attempts";

export async function POST(request: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId: slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const caseRow = await getPlayableCaseBySlug(supabase, slug);
  if (!caseRow) return NextResponse.json({ error: "case not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const initialConductText: string = typeof body.initialConductText === "string" ? body.initialConductText : "";

  const firstEvolution = caseRow.caseSpec.evolutions[0];
  const attempt = await createAttempt(supabase, {
    caseId: caseRow.id,
    userId: user.id,
    initialConductText,
    firstEvolutionId: firstEvolution.id,
  });

  return NextResponse.json({ attemptId: attempt.id, firstEvolutionId: firstEvolution.id });
}
