"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { InitialConductTimer } from "./InitialConductTimer";
import { PatientCard } from "./PatientCard";
import { VitalsPanel } from "./VitalsPanel";
import type { BaseCase } from "@/lib/engine/types";

export function CaseIntro({
  slug,
  baseCase,
  admissionVitalsTitle,
}: {
  slug: string;
  baseCase: BaseCase;
  admissionVitalsTitle: string;
}) {
  const t = useTranslations("caseDetail");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReveal(initialConductText: string) {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${slug}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initialConductText }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "failed to start attempt");
      const { attemptId } = await res.json();
      router.push(`/cases/${slug}/run/${attemptId}`);
    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PatientCard narrative={baseCase.narrative} />
      <VitalsPanel vitals={baseCase.vitals} title={admissionVitalsTitle} />
      <p className="flex gap-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        {t("flowNote")}
      </p>
      <InitialConductTimer
        seconds={baseCase.initialConductSeconds}
        onReveal={handleReveal}
        isSubmitting={isSubmitting}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
