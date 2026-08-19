import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { CaseStatus } from "@/lib/engine/types";

// Colour follows the mocks' accent roles: mint/teal for verified, amber for
// work-in-progress, muted for states students never see.
const CLASS_BY_STATUS: Record<CaseStatus, string> = {
  reviewed: "border-transparent bg-mint/18 text-[#0d7f72]",
  under_review: "border-transparent bg-[#ff9d6b]/20 text-[#b4571f]",
  draft: "border-transparent bg-muted text-muted-foreground",
  disabled: "border-transparent bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  const t = useTranslations("status");
  return (
    <Badge variant="outline" className={CLASS_BY_STATUS[status]}>
      {t(status)}
    </Badge>
  );
}
