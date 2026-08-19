"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Hard-gated reflection timer (plan.md Q8): the reveal button stays disabled
 * until `seconds` elapses, no skip. The free-text answer is passed to
 * onReveal so the caller can persist it (plan.md Q3) when starting the attempt.
 */
export function InitialConductTimer({
  seconds,
  onReveal,
  isSubmitting,
}: {
  seconds: number;
  onReveal: (text: string) => void;
  isSubmitting: boolean;
}) {
  const t = useTranslations("caseDetail");
  const [remaining, setRemaining] = useState(seconds);
  const [text, setText] = useState("");

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="initial-conduct">{t("initialConductLabel")}</Label>
      <Textarea
        id="initial-conduct"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("initialConductPlaceholder")}
        rows={4}
      />
      <Button
        type="button"
        disabled={remaining > 0 || isSubmitting}
        onClick={() => onReveal(text)}
      >
        {remaining > 0 ? t("waitingButton", { seconds: remaining }) : t("revealButton")}
      </Button>
    </div>
  );
}
