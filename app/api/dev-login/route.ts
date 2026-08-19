import { NextResponse } from "next/server";
import { isDevLoginAllowed } from "@/lib/auth/devLogin";

/**
 * Hands the dev-only test credentials to the browser so it can sign in against
 * Supabase directly.
 *
 * Why not sign in server-side? A POST to Supabase's /auth/v1/token from a
 * Vercel function hangs indefinitely (reproduced: ~0.2s for GET /auth/v1/user
 * and for signInWithOAuth, but every POST to the token endpoint times out,
 * while the identical request from a browser or laptop succeeds in ~0.4s).
 * Doing the sign-in in the browser sidesteps that path entirely.
 *
 * This exposes a throwaway account's password to anyone who can reach the
 * route — which is exactly the set of people who could already click the
 * one-tap dev-login button. It 404s unless isDevLoginAllowed(), so it does not
 * exist on a production deployment.
 */
export async function GET() {
  if (!isDevLoginAllowed()) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const email = process.env.DEV_LOGIN_EMAIL;
  const password = process.env.DEV_LOGIN_PASSWORD;
  if (!email || !password) {
    return NextResponse.json({ error: "dev login not configured" }, { status: 503 });
  }

  return NextResponse.json({ email, password }, { headers: { "cache-control": "no-store" } });
}
