"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Info, ListChecks, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/layout/Eyebrow";
import type { CaseBriefing } from "@/lib/engine/types";

/**
 * The pre-case briefing. Phase 2 dropped the hard-gated reflection timer
 * (reversing plan.md Q8) — forcing a 2–3 min wait works against the pressure the
 * run is built on — so this goes straight to "Assumir o caso".
 */
export function CaseIntro({
  slug,
  briefing,
  stepCount,
}: {
  slug: string;
  briefing: CaseBriefing;
  stepCount: number;
}) {
  const t = useTranslations("caseDetail");
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setIsStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${slug}/attempts`, { method: "POST" });
      if (!res.ok) throw new Error("failed to start");
      const { attemptId } = await res.json();
      router.push(`/cases/${slug}/run/${attemptId}`);
    } catch {
      setError(t("startError"));
      setIsStarting(false);
    }
  }

  const readings: [string, string | number][] = [
    ["PA", briefing.admissionVitals.pa],
    ["FC", briefing.admissionVitals.fc],
    ["SpO₂", `${briefing.admissionVitals.spo2}%`],
    ["FR", briefing.admissionVitals.fr],
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-1.5 text-[15px] text-muted-foreground">
        <Clock className="size-4" />
        {briefing.meta}
      </p>

      <div className="flex gap-3.5 rounded-[18px] border border-[rgba(20,58,107,0.1)] bg-card p-4 shadow-[0_16px_40px_-30px_rgba(13,59,102,0.6)]">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[repeating-linear-gradient(45deg,#e6ebf3,#e6ebf3_6px,#eef2f8_6px,#eef2f8_12px)] text-[#9aa7b5]">
          <UserRound className="size-7" />
        </span>
        <div className="self-center">
          <p className="font-heading text-lg font-bold">{briefing.patient}</p>
          <p className="text-sm text-muted-foreground">{briefing.patientDetail}</p>
        </div>
      </div>

      <div className="rounded-[18px] bg-[linear-gradient(150deg,#0d1f45,#171a54)] px-5 py-[18px] text-deep-foreground">
        <Eyebrow className="mb-3 block text-deep-muted">{t("admissionVitals")}</Eyebrow>
        <div className="grid grid-cols-4 gap-2">
          {readings.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[11px] text-deep-muted">{label}</span>
              <span className="font-heading text-lg font-extrabold leading-none">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-[18px] bg-secondary p-4">
        <p className="flex gap-2 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          {briefing.note}
        </p>
        <p className="flex gap-2 text-sm text-muted-foreground">
          <ListChecks className="mt-0.5 size-4 shrink-0" />
          {t("decisionsCount", { count: stepCount })}
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="button" variant="brand" size="cta" disabled={isStarting} onClick={start}>
        {isStarting ? t("starting") : t("takeCase")}
      </Button>
    </div>
  );
}
