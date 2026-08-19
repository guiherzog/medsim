import Link from "next/link";
import { useTranslations } from "next-intl";

export function AppHeader() {
  const t = useTranslations("app");
  return (
    <header className="border-b p-4">
      <Link href="/cases" className="text-lg font-semibold">
        {t("name")}
      </Link>
    </header>
  );
}
