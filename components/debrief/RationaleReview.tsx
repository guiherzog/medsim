import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Evolution, EvolutionScore } from "@/lib/engine/types";

/** Shows every option's rationale (plan.md Q5: all 6, not just the critical one), marked correct/incorrect and flagged if misclassified or if it was the missed critical option. */
export function RationaleReview({ evolution, evolutionScore }: { evolution: Evolution; evolutionScore: EvolutionScore }) {
  const t = useTranslations("debrief");
  const tOption = useTranslations("evolution");
  const resultByOptionId = new Map(evolutionScore.optionResults.map((r) => [r.optionId, r]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {evolution.id} — {t("rationaleTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {evolution.options.map((option) => {
          const result = resultByOptionId.get(option.id);
          return (
            <div key={option.id} className="border-b pb-2 last:border-none last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{option.text}</span>
                <Badge variant={option.correct ? "default" : "outline"}>
                  {option.correct ? tOption("correct") : tOption("incorrect")}
                </Badge>
                {option.critical && <Badge variant="destructive">{t("criticalOptionLabel")}</Badge>}
                {result?.wasMisclassified && <Badge variant="outline">{t("misclassifiedLabel")}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{option.rationale}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
