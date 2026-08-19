import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { EvolutionScore } from "@/lib/engine/types";

export function EvolutionScoreFeedback({
  evolutionScore,
  isComplete,
  onContinue,
}: {
  evolutionScore: EvolutionScore;
  isComplete: boolean;
  onContinue: () => void;
}) {
  const t = useTranslations("evolution");

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <p className="text-lg font-semibold">
          {t("scoreFeedback", { score: evolutionScore.score, maxScore: evolutionScore.maxScore })}
        </p>
        <p className={evolutionScore.criticalWasIdentified ? "text-sm text-green-600" : "text-sm text-destructive"}>
          {evolutionScore.criticalWasIdentified ? t("criticalIdentified") : t("criticalMissed")}
        </p>
        <Button type="button" variant="brand" size="cta" onClick={onContinue}>
          {isComplete ? t("finish") : t("next")}
        </Button>
      </CardContent>
    </Card>
  );
}
