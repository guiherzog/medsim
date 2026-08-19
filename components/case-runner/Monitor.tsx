"use client";

import { Activity, HeartCrack, Siren } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { VitalTile } from "./VitalTile";
import { deltaFrom, RANGES, severityOf, type PatientState } from "@/lib/engine/vitalStatus";
import type { Vitals, VitalKey } from "@/lib/engine/types";
import { formatClock, type Trend } from "@/lib/sim/useRun";

const KEYS: VitalKey[] = ["pa", "fc", "spo2", "fr"];

/**
 * The bedside monitor. When the patient is dying the panel goes near-black
 * rather than red — a red panel flattens the per-vital severity colours, which
 * are the whole point of the tiles. "Dying" is carried by the ring, the shake,
 * the banner and (in the run screen) the screen-edge vignette instead.
 */
export function Monitor({
  vitals,
  admissionVitals,
  trends,
  criticalVital,
  patientState,
  elapsed,
}: {
  vitals: Vitals;
  admissionVitals: Vitals;
  trends: Record<VitalKey, Trend>;
  criticalVital: VitalKey | null;
  patientState: PatientState;
  elapsed: number;
}) {
  const t = useTranslations("run");
  const dying = patientState === "dying";

  return (
    <div
      className={cn(
        "shrink-0 rounded-3xl p-5 transition-colors duration-500",
        dying
          ? "bg-[#0a0608] text-[#ffe3e0] ring-2 ring-[#ff6b6b] [animation:simShake_0.5s_ease-in-out_infinite]"
          : "bg-[#06121f] text-[#dbeafe] ring-1 ring-white/10",
      )}
    >
      <div className="mb-3.5 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span
              className={cn(
                "absolute inline-flex size-full animate-ping rounded-full opacity-75",
                dying ? "bg-[#ff6b6b]" : "bg-mint",
              )}
            />
            <span
              className={cn(
                "relative inline-flex size-2 rounded-full",
                dying ? "bg-[#ff6b6b]" : "bg-mint",
              )}
            />
          </span>
          <span
            className={cn(
              "font-mono text-[11px] tracking-[0.12em] uppercase",
              dying ? "text-[#ff8a80]" : "text-mint",
            )}
          >
            {dying ? t("unstable") : t("live")}
          </span>
        </span>
        <span className="flex items-center gap-1.5 font-mono text-sm tabular-nums text-[#8fb4d6]">
          <Activity className="size-3.5" />
          {formatClock(elapsed)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {KEYS.map((key) => (
          <VitalTile
            key={key}
            vitalKey={key}
            value={vitals[key]}
            severity={severityOf(key, vitals)}
            trend={trends[key]}
            delta={deltaFrom(admissionVitals, vitals, key)}
            isFocus={criticalVital === key}
          />
        ))}
      </div>

      {dying ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#ff6b6b] px-3 py-2.5">
          <HeartCrack className="size-5 shrink-0 animate-pulse text-white" />
          <span className="font-heading text-sm font-extrabold tracking-wide text-white uppercase">
            {t("dying")}
          </span>
        </div>
      ) : (
        criticalVital && (
          <div className="mt-3 flex animate-pulse items-center gap-2 rounded-xl bg-[#ff9d6b]/20 px-3 py-2 ring-1 ring-[#ff9d6b]/50">
            <Siren className="size-4 text-[#ffbe94]" />
            <span className="font-mono text-[11px] tracking-[0.08em] text-[#ffbe94] uppercase">
              {t("outOfRange", { vital: RANGES[criticalVital].label })}
            </span>
          </div>
        )
      )}
    </div>
  );
}
