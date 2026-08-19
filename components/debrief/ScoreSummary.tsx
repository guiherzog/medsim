import { useTranslations } from "next-intl";
import { DeepPanel } from "@/components/layout/DeepPanel";
import { Eyebrow } from "@/components/layout/Eyebrow";

/**
 * Mirrors the mocks' readiness-index panel: a deep navy surface with a
 * conic-gradient score ring and a mono eyebrow label.
 */
export function ScoreSummary({ score, maxScore }: { score: number; maxScore: number }) {
  const t = useTranslations("debrief");
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return (
    <DeepPanel className="flex items-center gap-5">
      <div
        className="relative flex size-[104px] shrink-0 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(var(--mint) 0% ${pct}%, rgba(255,255,255,0.1) ${pct}% 100%)`,
        }}
      >
        <div className="absolute flex size-[78px] flex-col items-center justify-center rounded-full bg-[#122250]">
          <span className="font-heading text-[30px] font-extrabold leading-none">{score}</span>
          <span className="text-[11px] text-deep-muted">/{maxScore}</span>
        </div>
      </div>
      <div>
        <Eyebrow className="text-deep-muted">{t("title")}</Eyebrow>
        <p className="mt-1 font-heading text-xl font-bold">{t("score", { score, maxScore })}</p>
      </div>
    </DeepPanel>
  );
}
