"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/client";

// Prefers an explicit site URL, falls back to Vercel's per-deployment URL
// (so every preview deployment gets a working OAuth redirect automatically),
// falls back to localhost for local dev.
function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl()}/auth/callback`,
    },
  });
  if (error || !data.url) redirect("/login?error=auth");
  redirect(data.url);
}
