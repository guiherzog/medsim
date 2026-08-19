import Link from "next/link";
import { Activity } from "lucide-react";
import { useTranslations } from "next-intl";
import { IconTile } from "./IconTile";

export function AppHeader() {
  const t = useTranslations("app");
  return (
    <header className="mx-auto flex w-full max-w-[520px] items-center gap-2.5 px-6 pb-1 pt-5">
      <Link href="/cases" className="flex items-center gap-2.5">
        <IconTile tone="brand" size="sm">
          <Activity />
        </IconTile>
        <span className="font-heading text-lg font-extrabold tracking-tight">{t("name")}</span>
      </Link>
    </header>
  );
}
