"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { OptionList } from "./OptionList";
import { EvolutionScoreFeedback } from "./EvolutionScoreFeedback";
import type { EvolutionScore } from "@/lib/engine/types";

interface SubmitResult {
  evolutionScore: EvolutionScore;
  isComplete: boolean;
  nextEvolutionId: string | null;
}

/**
 * One evolution's interactive flow: options -> submit -> immediate feedback -> continue.
 * Keyed by evolutionId from the server (see run/[attemptId]/page.tsx), so a fresh
 * evolution always remounts with clean state instead of carrying over feedback.
 */
export function EvolutionRunner({
  attemptId,
  evolutionId,
  caseSlug,
  options,
}: {
  attemptId: string;
  evolutionId: string;
  caseSlug: string;
  options: { id: string; text: string }[];
}) {
  const router = useRouter();
  const [result, setResult] = useState<SubmitResult | null>(null);

  if (result) {
    return (
      <EvolutionScoreFeedback
        evolutionScore={result.evolutionScore}
        isComplete={result.isComplete}
        onContinue={() => {
          if (result.isComplete) {
            router.push(`/cases/${caseSlug}/debrief/${attemptId}`);
          } else {
            router.refresh();
          }
        }}
      />
    );
  }

  return (
    <OptionList
      options={options}
      attemptId={attemptId}
      evolutionId={evolutionId}
      onSubmitted={setResult}
    />
  );
}
