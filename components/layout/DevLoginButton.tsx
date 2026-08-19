"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/db/browserClient";

/**
 * Dev-only sign-in, performed in the browser rather than in a Server Action —
 * see app/api/dev-login/route.ts for why the server-side path is unusable on
 * Vercel. Rendered only when isDevLoginAllowed().
 */
export function DevLoginButton() {
  const t = useTranslations("login");
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleClick() {
    setIsPending(true);
    setFailed(false);
    try {
      const res = await fetch("/api/dev-login");
      if (!res.ok) throw new Error("dev login unavailable");
      const { email, password } = await res.json();

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      router.push("/cases");
    } catch {
      setFailed(true);
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="cta"
        className="text-base"
        disabled={isPending}
        onClick={handleClick}
      >
        {t("devButton")}
      </Button>
      {failed && (
        <p className="text-sm text-destructive" role="alert">
          {t("error")}
        </p>
      )}
    </div>
  );
}
