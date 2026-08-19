import { getTranslations } from "next-intl/server";
import { AppHeader } from "@/components/layout/AppHeader";
import { CaseCard } from "@/components/case-runner/CaseCard";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/db/client";
import { listPlayableCases } from "@/lib/db/queries/cases";
import { requireUser } from "@/lib/auth/session";

export default async function CasesPage() {
  await requireUser();
  const t = await getTranslations("cases");
  const supabase = await createClient();
  const cases = await listPlayableCases(supabase);

  return (
    <>
      <AppHeader />
      <main>
        <AppShell>
          <h1 className="text-[28px]">{t("title")}</h1>
          {cases.length === 0 ? (
            <p className="text-muted-foreground">{t("empty")}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {cases.map((c) => (
                <CaseCard key={c.id} caseItem={c} />
              ))}
            </div>
          )}
        </AppShell>
      </main>
    </>
  );
}
