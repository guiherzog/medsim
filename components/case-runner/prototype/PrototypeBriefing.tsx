// PROTOTYPE — throwaway. See PROTOTYPE_README.md.
"use client";

import { Clock, Info, ListChecks, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/layout/Eyebrow";
import { PROTOTYPE_BRIEFING } from "./prototypeCase";

/**
 * The mocks' pre-case briefing: eyebrow + title + meta line, the patient in a
 * hatched-avatar card, admission vitals on the deep navy panel, a note about
 * how the case runs, and "Assumir o caso" as the commitment.
 *
 * Note it does NOT hard-gate on a 2–3 min reflection timer the way the shipped
 * case screen does (plan.md Q8). Forcing a wait before an emergency case works
 * against the pressure this model is built on — worth revisiting when this is
 * folded in for real.
 */
export function PrototypeBriefing({ onStart }: { onStart: () => void }) {
  const b = PROTOTYPE_BRIEFING;

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-4">
      <div>
        <div className="flex items-center gap-2">
          <Eyebrow className="text-muted-foreground">{b.category}</Eyebrow>
          <Badge variant="outline" className="border-transparent bg-[#ff9d6b]/20 text-[#b4571f]">
            Em validação
          </Badge>
        </div>
        <h1 className="mt-3 text-[28px] leading-[1.06]">{b.title}</h1>
        <p className="mt-2 flex items-center gap-1.5 text-[15px] text-muted-foreground">
          <Clock className="size-4" />
          {b.meta}
        </p>
      </div>

      {/* Patient */}
      <div className="flex gap-3.5 rounded-[18px] border border-[rgba(20,58,107,0.1)] bg-card p-4 shadow-[0_16px_40px_-30px_rgba(13,59,102,0.6)]">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[repeating-linear-gradient(45deg,#e6ebf3,#e6ebf3_6px,#eef2f8_6px,#eef2f8_12px)] text-[#9aa7b5]">
          <UserRound className="size-7" />
        </span>
        <div className="self-center">
          <p className="font-heading text-lg font-bold">{b.patient}</p>
          <p className="text-sm text-muted-foreground">{b.patientDetail}</p>
        </div>
      </div>

      {/* Admission vitals */}
      <div className="rounded-[18px] bg-[linear-gradient(150deg,#0d1f45,#171a54)] px-5 py-[18px] text-deep-foreground">
        <Eyebrow className="mb-3 block text-deep-muted">Vitais na admissão</Eyebrow>
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              ["PA", b.admissionVitals.pa],
              ["FC", b.admissionVitals.fc],
              ["SpO₂", `${b.admissionVitals.spo2}%`],
              ["FR", b.admissionVitals.fr],
            ] as const
          ).map(([label, value]) => (
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
          {b.note}
        </p>
        <p className="flex gap-2 text-sm text-muted-foreground">
          <ListChecks className="mt-0.5 size-4 shrink-0" />
          {b.decisions} decisões · cada uma com tempo limitado
        </p>
      </div>

      <Button type="button" variant="brand" size="cta" onClick={onStart}>
        Assumir o caso
      </Button>
    </div>
  );
}
