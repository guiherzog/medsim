import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { CaseStatus } from "@/lib/engine/types";

const VARIANT_BY_STATUS: Record<CaseStatus, "default" | "secondary" | "outline"> = {
  reviewed: "default",
  under_review: "secondary",
  draft: "outline",
  disabled: "outline",
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  const t = useTranslations("status");
  return <Badge variant={VARIANT_BY_STATUS[status]}>{t(status)}</Badge>;
}
