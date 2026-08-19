import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Verifies the core multi-user guarantee behind plan.md Q7 ("attempts are
 * owned by the user who started them"): case_attempts RLS must let a user
 * read their own attempt and must NOT let a different authenticated user
 * read it, even though both are legitimately logged in.
 */
describe("case_attempts RLS", () => {
  const admin: SupabaseClient = createClient(url, serviceKey);
  let caseId: string;
  let attemptId: string;
  const userAEmail = `rls-test-a-${randomUUID()}@medsim.local`;
  const userBEmail = `rls-test-b-${randomUUID()}@medsim.local`;
  const password = randomUUID();
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    const { data: caseRow, error: caseError } = await admin
      .from("cases")
      .select("id")
      .eq("slug", "dor-toracica-iam-vd")
      .single();
    if (caseError || !caseRow) throw new Error(`fixture case not found — run pnpm seed first: ${caseError?.message}`);
    caseId = caseRow.id;

    const { data: userA, error: userAError } = await admin.auth.admin.createUser({
      email: userAEmail,
      password,
      email_confirm: true,
    });
    if (userAError || !userA.user) throw new Error(`failed to create user A: ${userAError?.message}`);
    userAId = userA.user.id;

    const { data: userB, error: userBError } = await admin.auth.admin.createUser({
      email: userBEmail,
      password,
      email_confirm: true,
    });
    if (userBError || !userB.user) throw new Error(`failed to create user B: ${userBError?.message}`);
    userBId = userB.user.id;

    const { data: attempt, error: attemptError } = await admin
      .from("case_attempts")
      .insert({ case_id: caseId, user_id: userAId, current_evolution_id: "1.A" })
      .select()
      .single();
    if (attemptError || !attempt) throw new Error(`failed to seed attempt: ${attemptError?.message}`);
    attemptId = attempt.id;
  });

  afterAll(async () => {
    if (attemptId) await admin.from("case_attempts").delete().eq("id", attemptId);
    if (userAId) await admin.auth.admin.deleteUser(userAId);
    if (userBId) await admin.auth.admin.deleteUser(userBId);
  });

  it("lets the owning user read their own attempt", async () => {
    const asUserA = createClient(url, anonKey);
    const { error: signInError } = await asUserA.auth.signInWithPassword({ email: userAEmail, password });
    expect(signInError).toBeNull();

    const { data, error } = await asUserA.from("case_attempts").select().eq("id", attemptId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("hides the attempt from a different authenticated user", async () => {
    const asUserB = createClient(url, anonKey);
    const { error: signInError } = await asUserB.auth.signInWithPassword({ email: userBEmail, password });
    expect(signInError).toBeNull();

    const { data, error } = await asUserB.from("case_attempts").select().eq("id", attemptId);
    expect(error).toBeNull(); // RLS filters rows silently, it doesn't error
    expect(data).toHaveLength(0);
  });
});
