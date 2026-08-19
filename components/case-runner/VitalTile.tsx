"use client";

import { Minus, MoveDown, MoveUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { RANGES, type Severity } from "@/lib/engine/vitalStatus";
import type { VitalKey } from "@/lib/engine/types";
import type { Trend } from "@/lib/sim/useRun";

/** Each severity carries its own colour, ring and word, so a reading is readable without a legend. */
const SEVERITY: Record<Severity, { tile: string; value: string; chip: string }> = {
  normal: {
    tile: "bg-white/5 ring-1 ring-white/10",
    value: "text-[#eaf1fb]",
    chip: "bg-mint/20 text-mint",
  },
  warning: {
    tile: "bg-[#ff9d6b]/12 ring-1 ring-[#ff9d6b]/40",
    value: "text-[#ffbe94]",
    chip: "bg-[#ff9d6b]/25 text-[#ffbe94]",
  },
  critical: {
    tile: "bg-[#ff6b6b]/18 ring-2 ring-[#ff6b6b]/70",
    value: "text-[#ff8a80]",
    chip: "bg-[#ff6b6b] text-white",
  },
};

function TrendIcon({ trend, severity }: { trend: Trend; severity: Severity }) {
  const Icon = trend === "up" ? MoveUp : trend === "down" ? MoveDown : Minus;
  return (
    <Icon
      className={cn(
        "size-3.5",
        trend === "flat" ? "text-white/25" : severity === "normal" ? "text-mint" : "text-current",
        trend !== "flat" && "animate-pulse",
      )}
    />
  );
}

export function VitalTile({
  vitalKey,
  value,
  severity,
  trend,
  delta,
  isFocus,
}: {
  vitalKey: VitalKey;
  value: string | number;
  severity: Severity;
  trend: Trend;
  delta: string | null;
  /** The reading the current situation hinges on. */
  isFocus: boolean;
}) {
  const t = useTranslations("run.severity");
  const s = SEVERITY[severity];
  const range = RANGES[vitalKey];

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-2xl px-3.5 py-2.5 transition-colors duration-500",
        s.tile,
        isFocus && severity === "critical" && "animate-pulse",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono text-[10px] tracking-[0.1em] text-[#8fb4d6]">{range.label}</span>
        <TrendIcon trend={trend} severity={severity} />
      </div>

      <div className="flex items-baseline gap-1">
        <span
          className={cn("font-heading text-[26px] font-extrabold leading-none tabular-nums", s.value)}
        >
          {value}
        </span>
        <span className="text-[10px] text-[#8fb4d6]/70">{range.unit}</span>
      </div>

      <div className="flex items-center justify-between gap-1">
        <span
          className={cn(
            "rounded px-1 py-px font-mono text-[9px] tracking-[0.08em] uppercase",
            s.chip,
          )}
        >
          {t(severity)}
        </span>
        <span className="font-mono text-[9px] text-[#8fb4d6]/60">
          {delta ? `${delta} · ` : ""}
          {range.normal}
        </span>
      </div>
    </div>
  );
}
