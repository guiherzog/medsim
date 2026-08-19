import { useTranslations } from "next-intl";
import type { Vitals } from "@/lib/engine/types";

function VitalStat({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex flex-col items-center rounded-md border p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold">{value === null ? "—" : value}</span>
    </div>
  );
}

export function VitalsPanel({ vitals, title }: { vitals: Vitals; title: string }) {
  const t = useTranslations("caseDetail");
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="grid grid-cols-3 gap-2">
        <VitalStat label={t("pa")} value={vitals.pa} />
        <VitalStat label={t("fc")} value={vitals.fc} />
        <VitalStat label={t("spo2")} value={vitals.spo2 === null ? null : `${vitals.spo2}%`} />
      </div>
    </div>
  );
}
