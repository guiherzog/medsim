"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { RadioGroup } from "@/components/ui/radio-group";
import { OptionRow } from "./OptionRow";
import type { EvolutionScore, Option, OptionCall } from "@/lib/engine/types";

export function OptionList({
  options,
  attemptId,
  evolutionId,
  onSubmitted,
}: {
  options: Pick<Option, "id" | "text">[];
  attemptId: string;
  evolutionId: string;
  onSubmitted: (result: { evolutionScore: EvolutionScore; isComplete: boolean; nextEvolutionId: string | null }) => void;
}) {
  const t = useTranslations("evolution");
  const [calls, setCalls] = useState<Record<string, OptionCall>>({});
  const [mostDangerousPick, setMostDangerousPick] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allClassified = options.every((o) => calls[o.id] !== undefined);
  const canSubmit = allClassified && mostDangerousPick !== "" && !isSubmitting;

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/evolutions/${evolutionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calls, mostDangerousPick }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "submit failed");
      const result = await res.json();
      onSubmitted(result);
    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t("optionsInstructions")}</p>
      <RadioGroup value={mostDangerousPick} onValueChange={setMostDangerousPick} className="flex flex-col gap-2">
        {options.map((option) => (
          <OptionRow
            key={option.id}
            option={option}
            call={calls[option.id]}
            onCallChange={(id, call) => setCalls((prev) => ({ ...prev, [id]: call }))}
            disabled={isSubmitting}
          />
        ))}
      </RadioGroup>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col items-end gap-1">
        {!canSubmit && !isSubmitting && (
          <p className="text-xs text-muted-foreground">{t("submitDisabledHint")}</p>
        )}
        <Button type="button" disabled={!canSubmit} onClick={handleSubmit}>
          {t("submit")}
        </Button>
      </div>
    </div>
  );
}
