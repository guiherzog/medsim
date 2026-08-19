import { useTranslations } from "next-intl";
import { Eyebrow } from "@/components/layout/Eyebrow";
import type { Vitals } from "@/lib/engine/types";

function VitalStat({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-card p-3 ring-1 ring-border">
      <Eyebrow className="text-muted-foreground">{label}</Eyebrow>
      <span className="font-heading text-xl font-extrabold">{value === null ? "—" : value}</span>
    </div>
  );
}

export function VitalsPanel({ vitals, title }: { vitals: Vitals; title: string }) {
  const t = useTranslations("caseDetail");
  return (
    <div>
      <Eyebrow className="mb-2 block text-muted-foreground">{title}</Eyebrow>
      <div className="grid grid-cols-3 gap-2">
        <VitalStat label={t("pa")} value={vitals.pa} />
        <VitalStat label={t("fc")} value={vitals.fc} />
        <VitalStat label={t("spo2")} value={vitals.spo2 === null ? null : `${vitals.spo2}%`} />
      </div>
    </div>
  );
}
