import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import type { EvolutionScore } from "@/lib/engine/types";

export function EvolutionBreakdown({ evolutionScores }: { evolutionScores: EvolutionScore[] }) {
  const t = useTranslations("debrief");

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">{t("evolutionBreakdown")}</h2>
      {evolutionScores.map((es) => (
        <Card key={es.evolutionId}>
          <CardContent className="flex items-center justify-between">
            <span className="font-medium">{es.evolutionId}</span>
            <span>
              {es.score} / {es.maxScore}
            </span>
            {es.criticalWasIdentified ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
