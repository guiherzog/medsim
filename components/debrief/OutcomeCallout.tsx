import { CheckCircle2, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  good: {
    wrap: "border-mint/40 bg-mint/10",
    icon: "text-[#0d7f72]",
    Icon: CheckCircle2,
  },
  bad: {
    wrap: "border-destructive/30 bg-destructive/8",
    icon: "text-destructive",
    Icon: CircleAlert,
  },
} as const;

/**
 * The mocks' debrief callouts — "O que foi bem" (check_circle) and "Ponto
 * crítico de falha" (error) — as a tinted bordered row with a leading icon.
 */
export function OutcomeCallout({
  tone,
  title,
  children,
}: {
  tone: keyof typeof TONES;
  title: string;
  children: React.ReactNode;
}) {
  const { wrap, icon, Icon } = TONES[tone];
  return (
    <div className={cn("flex gap-3 rounded-[18px] border p-4", wrap)}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", icon)} />
      <div className="flex flex-col gap-1">
        <p className="font-heading font-bold">{title}</p>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
