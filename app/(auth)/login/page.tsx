import { Activity, HeartPulse, MessageSquareCheck, Route } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/AppShell";
import { DeepPanel } from "@/components/layout/DeepPanel";
import { IconTile } from "@/components/layout/IconTile";
import { signInWithGoogle } from "./actions";
import { isDevLoginAllowed } from "@/lib/auth/devLogin";
import { DevLoginButton } from "@/components/layout/DevLoginButton";

const SELLING_POINTS = [
  { key: "evolves", icon: HeartPulse, tone: "mint" },
  { key: "feedback", icon: MessageSquareCheck, tone: "violet" },
  { key: "tracks", icon: Route, tone: "sky" },
] as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const t = await getTranslations("login");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col justify-center py-6">
      <AppShell>
        <DeepPanel>
          <IconTile tone="brand" size="lg" className="mb-6">
            <Activity />
          </IconTile>
          <h1 className="font-heading text-[34px] leading-[1.05] font-extrabold">{t("headline")}</h1>
          <p className="mt-4 text-[17px] leading-relaxed text-[#c7d8e8]">{t("subtitle")}</p>
        </DeepPanel>

        <ul className="flex flex-col gap-3">
          {SELLING_POINTS.map(({ key, icon: Icon, tone }) => (
            <li key={key} className="flex items-center gap-3 text-[15px]">
              <IconTile tone={tone}>
                <Icon />
              </IconTile>
              {t(`points.${key}`)}
            </li>
          ))}
        </ul>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {t("error")}
          </p>
        )}

        <div className="mt-1 flex flex-col gap-3">
          <form action={signInWithGoogle}>
            <Button type="submit" variant="brand" size="cta">
              {t("googleButton")}
            </Button>
          </form>
          {isDevLoginAllowed() && <DevLoginButton />}
        </div>
      </AppShell>
    </main>
  );
}
