import { getTranslations } from "next-intl/server";
import { AppHeader } from "@/components/layout/AppHeader";
import { CaseCard } from "@/components/case-runner/CaseCard";
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
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="mb-4 text-2xl font-semibold">{t("title")}</h1>
        {cases.length === 0 ? (
          <p className="text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {cases.map((c) => (
              <CaseCard key={c.id} caseItem={c} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
