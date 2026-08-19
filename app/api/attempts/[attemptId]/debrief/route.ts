import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getAttempt } from "@/lib/db/queries/attempts";

export async function GET(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
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

  return NextResponse.json({
    status: attempt.status,
    finalScore: attempt.finalScore,
    maxPossibleScore: attempt.maxPossibleScore,
    evolutionResults: attempt.evolutionResults,
  });
}
