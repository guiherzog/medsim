import { readdirSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { loadCaseSpec } from "../../lib/engine/loadCaseSpec";
import type { CaseSpec, CaseStatus } from "../../lib/engine/types";

const CASES_DIR = path.join(__dirname, "../../content/cases");

function statusFor(spec: CaseSpec): CaseStatus {
  // Never fabricates a sign-off (plan.md Q12): status only becomes "reviewed"
  // when a real doctor's approval fields are present in the YAML.
  const approved = Boolean(spec.approval?.approvedBy && spec.approval?.approvedAt);
  return approved ? "reviewed" : "under_review";
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.local)");
  }

  const supabase = createClient(url, serviceKey);
  const files = readdirSync(CASES_DIR).filter((f) => f.endsWith(".yaml"));

  for (const file of files) {
    const spec = loadCaseSpec(path.join(CASES_DIR, file));
    const status = statusFor(spec);

    const { error } = await supabase.from("cases").upsert(
      {
        slug: spec.slug,
        title: spec.title,
        category: spec.category,
        disclaimer: spec.disclaimer,
        case_spec: spec,
        status,
        approved_by: spec.approval?.approvedBy ?? null,
        approved_at: spec.approval?.approvedAt ?? null,
      },
      { onConflict: "slug" },
    );

    if (error) {
      throw new Error(`failed to upsert ${spec.slug}: ${error.message}`);
    }

    if (status === "under_review") {
      console.warn(`[seed_cases] ⚠ ${spec.slug} seeded as under_review — no real doctor approval on file`);
    } else {
      console.log(`[seed_cases] ${spec.slug} seeded as reviewed (approved_by: ${spec.approval?.approvedBy})`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
