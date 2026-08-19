import { getTranslations } from "next-intl/server";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Eyebrow } from "@/components/layout/Eyebrow";
import { CaseCard } from "@/components/case-runner/CaseCard";
import { createClient } from "@/lib/db/client";
import { listPlayableCases, type CaseListItem } from "@/lib/db/queries/cases";
import { requireUser } from "@/lib/auth/session";

/** Groups by specialty, preserving the query's category ordering. */
function byCategory(cases: CaseListItem[]) {
  const groups = new Map<string, CaseListItem[]>();
  for (const c of cases) {
    const existing = groups.get(c.category);
    if (existing) existing.push(c);
    else groups.set(c.category, [c]);
  }
  return [...groups.entries()];
}

export default async function CasesPage() {
  await requireUser();
  const t = await getTranslations("cases");
  const supabase = await createClient();
  const cases = await listPlayableCases(supabase);
  const groups = byCategory(cases);

  return (
    <>
      <AppHeader />
      <main>
        <AppShell>
          <header className="flex flex-col gap-2">
            <h1 className="text-[28px] leading-[1.06]">{t("title")}</h1>
            <p className="text-[15px] text-muted-foreground">{t("subtitle")}</p>
            {cases.length > 0 && (
              <p className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
                {cases.length === 1 ? t("countOne") : t("countOther", { count: cases.length })}
                {" · "}
                {t("categories", { count: groups.length })}
              </p>
            )}
          </header>

          {cases.length === 0 ? (
            <p className="text-muted-foreground">{t("empty")}</p>
          ) : (
            groups.map(([category, items], groupIndex) => (
              <section key={category} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Eyebrow className="text-muted-foreground">{category}</Eyebrow>
                  <span className="h-px flex-1 bg-border" />
                </div>
                {items.map((item, itemIndex) => (
                  <CaseCard
                    key={item.id}
                    caseItem={item}
                    // The first card of the list gets the mocks' larger treatment.
                    featured={groupIndex === 0 && itemIndex === 0}
                  />
                ))}
              </section>
            ))
          )}
        </AppShell>
      </main>
    </>
  );
}
