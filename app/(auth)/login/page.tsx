import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithGoogle, signInAsDevUser } from "./actions";
import { isDevLoginAllowed } from "@/lib/auth/devLogin";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const t = await getTranslations("login");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {t("error")}
            </p>
          )}
          <form action={signInWithGoogle}>
            <Button type="submit" className="w-full">
              {t("googleButton")}
            </Button>
          </form>
          {isDevLoginAllowed() && (
            <form action={signInAsDevUser}>
              <Button type="submit" variant="outline" className="w-full">
                {t("devButton")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
