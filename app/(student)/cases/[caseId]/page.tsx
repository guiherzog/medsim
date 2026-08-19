import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/layout/AppShell";
import { Eyebrow } from "@/components/layout/Eyebrow";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { SpecialtyMark } from "@/components/illustrations/SpecialtyMark";
import { CaseIntro } from "@/components/case-runner/CaseIntro";
import { createClient } from "@/lib/db/client";
import { getPlayableCaseBySlug } from "@/lib/db/queries/cases";
import { requireUser } from "@/lib/auth/session";

export default async function CaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  await requireUser();
  const { caseId: slug } = await params;
  const t = await getTranslations("cases");
  const supabase = await createClient();
  const caseRow = await getPlayableCaseBySlug(supabase, slug);
  if (!caseRow) notFound();

  return (
    <>
      <main className="pt-4">
        <AppShell>
          <Link
            href="/cases"
            className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {t("back")}
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Eyebrow className="text-muted-foreground">{caseRow.category}</Eyebrow>
              <StatusBadge status={caseRow.status} />
            </div>
            <div className="mt-3 flex items-start gap-3">
              <SpecialtyMark category={caseRow.category} />
              <h1 className="text-[28px] leading-[1.06]">{caseRow.title}</h1>
            </div>
          </div>
          <CaseIntro
            slug={caseRow.slug}
            briefing={caseRow.caseSpec.briefing}
            stepCount={caseRow.caseSpec.steps.length}
          />
        </AppShell>
      </main>
    </>
  );
}
