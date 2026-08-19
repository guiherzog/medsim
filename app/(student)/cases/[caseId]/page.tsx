import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AppHeader } from "@/components/layout/AppHeader";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
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
      <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
        <DisclaimerBanner disclaimer={caseRow.disclaimer} />
        <h1 className="text-2xl font-semibold">{caseRow.title}</h1>
        <CaseIntro slug={caseRow.slug} baseCase={caseRow.caseSpec.baseCase} vitalsTitle={t("vitalsTitle")} />
      </main>
    </>
  );
}
