import { BookOpenCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Eyebrow } from "./Eyebrow";
import { IconTile } from "./IconTile";

/**
 * Home-page selling point: the reference protocols the cases are built on.
 * This is the credibility half of what used to be the per-case AVISO banner —
 * the "not yet preceptor-reviewed" half lives on the case's status
 * ("Em validação" via StatusBadge), not here.
 */
const PROTOCOLS = ["ACLS/AHA", "WAO/EAACI", "Surviving Sepsis Campaign"];

export function ProtocolReferences() {
  const t = useTranslations("login.references");

  return (
    <div className="flex gap-3.5 rounded-[18px] border border-[rgba(20,58,107,0.1)] bg-card p-4">
      <IconTile tone="sky" size="lg">
        <BookOpenCheck />
      </IconTile>
      <div className="flex flex-col gap-2">
        <div>
          <Eyebrow className="text-muted-foreground">{t("eyebrow")}</Eyebrow>
          <p className="font-heading font-bold leading-snug">{t("title")}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PROTOCOLS.map((p) => (
            <Badge key={p} variant="outline" className="font-normal">
              {p}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
