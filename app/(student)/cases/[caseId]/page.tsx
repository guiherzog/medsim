import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { Eyebrow } from "@/components/layout/Eyebrow";
import { CaseIntro } from "@/components/case-runner/CaseIntro";
import { createClient } from "@/lib/db/client";
import { getPlayableCaseBySlug } from "@/lib/db/queries/cases";
import { requireUser } from "@/lib/auth/session";

export default async function CaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  await requireUser();
  const { caseId: slug } = await params;
  const t = await getTranslations("caseDetail");
  const supabase = await createClient();
  const caseRow = await getPlayableCaseBySlug(supabase, slug);
  if (!caseRow) notFound();

  return (
    <>
      <AppHeader />
      <main>
        <AppShell>
          <DisclaimerBanner disclaimer={caseRow.disclaimer} />
          {/* The mocks lead a case briefing with a mono eyebrow, then the title. */}
          <div>
            <Eyebrow className="text-muted-foreground">{caseRow.category}</Eyebrow>
            <h1 className="mt-3 text-[28px] leading-[1.06]">{caseRow.title}</h1>
          </div>
          <CaseIntro
            slug={caseRow.slug}
            baseCase={caseRow.caseSpec.baseCase}
            admissionVitalsTitle={t("admissionVitals")}
          />
        </AppShell>
      </main>
    </>
  );
}
