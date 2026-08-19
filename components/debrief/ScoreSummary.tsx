import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function ScoreSummary({ score, maxScore }: { score: number; maxScore: number }) {
  const t = useTranslations("debrief");
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-3xl font-bold">{t("score", { score, maxScore })}</p>
        <Progress value={pct} />
      </CardContent>
    </Card>
  );
}
