import Link from "next/link";
import { ChevronRight, Clock, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { cn } from "@/lib/utils";
import type { CaseListItem } from "@/lib/db/queries/cases";

/**
 * The mocks' case card: a meta row of chips, the title, the patient one-liner,
 * and an explicit "Iniciar caso" affordance. The mocks also show GRÁTIS HOJE /
 * PRO-lock chips and a "recommended for your gaps" rail — both belong to the
 * paywall and the gap-analysis dashboard, which are out of scope (plan.md), so
 * they are deliberately absent rather than faked.
 *
 * `featured` gives the first card of the list the mocks' larger treatment.
 */
export function CaseCard({
  caseItem,
  featured = false,
}: {
  caseItem: CaseListItem;
  featured?: boolean;
}) {
  const t = useTranslations("cases");

  return (
    <Link
      href={`/cases/${caseItem.slug}`}
      className={cn(
        "group flex flex-col gap-3 rounded-[20px] border border-[rgba(20,58,107,0.1)] bg-card p-4 transition-all",
        "hover:-translate-y-0.5 hover:border-sky/50 hover:shadow-[0_18px_40px_-28px_rgba(13,59,102,0.55)]",
        featured && "gap-4 p-5",
      )}
    >
      {/* The category lives on the section header, not here — repeating it on
          every card was pure noise. */}
      <StatusBadge status={caseItem.status} />

      <div className="flex flex-col gap-1.5">
        <h3
          className={cn(
            "font-heading leading-snug font-bold text-balance",
            featured ? "text-[22px]" : "text-[17px]",
          )}
        >
          {caseItem.title}
        </h3>
        {caseItem.patientDetail && (
          <div className="flex gap-1.5 text-sm text-muted-foreground">
            <UserRound className="mt-0.5 size-3.5 shrink-0" />
            {/* line-clamp sets display:-webkit-box, so it can't share an element
                with the flex row holding the icon. */}
            <span className={featured ? "line-clamp-3" : "line-clamp-2"}>
              {caseItem.patientDetail}
            </span>
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
        {caseItem.meta && (
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <Clock className="size-3.5" />
            {caseItem.meta}
          </span>
        )}
        <span className="ml-auto flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
          {t("start")}
          <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
