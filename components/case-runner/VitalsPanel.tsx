import { useTranslations } from "next-intl";
import { Eyebrow } from "@/components/layout/Eyebrow";
import { cn } from "@/lib/utils";
import type { Vitals } from "@/lib/engine/types";

function VitalStat({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-deep-muted">{label}</span>
      <span className="font-heading text-lg font-extrabold leading-none">
        {value === null ? "—" : value}
      </span>
    </div>
  );
}

/**
 * The mocks' vitals block: a deep navy panel with a mono eyebrow and a row of
 * label-over-value stats. `null` renders as "—" (plan.md Q4: not disclosed at
 * this stage, never carried forward from a previous one).
 */
export function VitalsPanel({
  vitals,
  title,
  className,
}: {
  vitals: Vitals;
  title: string;
  className?: string;
}) {
  const t = useTranslations("caseDetail");
  return (
    <div
      className={cn(
        "rounded-[18px] bg-[linear-gradient(150deg,#0d1f45,#171a54)] px-5 py-[18px] text-deep-foreground",
        className,
      )}
    >
      <Eyebrow className="mb-3 block text-deep-muted">{title}</Eyebrow>
      <div className="grid grid-cols-3 gap-2">
        <VitalStat label={t("pa")} value={vitals.pa} />
        <VitalStat label={t("fc")} value={vitals.fc} />
        <VitalStat label={t("spo2")} value={vitals.spo2 === null ? null : `${vitals.spo2}%`} />
      </div>
    </div>
  );
}
