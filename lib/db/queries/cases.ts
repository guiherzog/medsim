import type { SupabaseClient } from "@supabase/supabase-js";
import type { CaseSpec, CaseStatus } from "@/lib/engine/types";

export interface CaseListItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: CaseStatus;
  /** e.g. "~4 min · difícil · IAM de parede inferior" */
  meta: string | null;
  /** The patient one-liner, so a card says who this is about. */
  patientDetail: string | null;
}

/**
 * Deliberately not extending CaseListItem: the list row carries flattened
 * projections of a couple of briefing fields, while a detail row carries the
 * whole spec and reads those fields straight off `caseSpec.briefing`.
 */
export interface CaseRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: CaseStatus;
  disclaimer: string;
  caseSpec: CaseSpec;
}

export async function listPlayableCases(supabase: SupabaseClient): Promise<CaseListItem[]> {
  // Projects just the two briefing fields the cards need rather than selecting
  // case_spec — the list has no business shipping every case's answer key.
  const { data, error } = await supabase
    .from("cases")
    .select(
      "id, slug, title, category, status, meta:case_spec->briefing->>meta, patientDetail:case_spec->briefing->>patientDetail",
    )
    .in("status", ["under_review", "reviewed"])
    .order("category")
    .order("title");

  if (error) throw new Error(`listPlayableCases failed: ${error.message}`);
  return (data as CaseListItem[]).map((c) => ({
    ...c,
    // YAML block scalars keep a trailing newline.
    meta: c.meta?.trim() ?? null,
    patientDetail: c.patientDetail?.trim() ?? null,
  }));
}

export async function getCaseById(supabase: SupabaseClient, id: string): Promise<CaseRow | null> {
  const { data, error } = await supabase
    .from("cases")
    .select("id, slug, title, category, status, disclaimer, case_spec")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getCaseById failed: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    category: data.category,
    status: data.status,
    disclaimer: data.disclaimer,
    caseSpec: data.case_spec as CaseSpec,
  };
}

export async function getPlayableCaseBySlug(supabase: SupabaseClient, slug: string): Promise<CaseRow | null> {
  const { data, error } = await supabase
    .from("cases")
    .select("id, slug, title, category, status, disclaimer, case_spec")
    .eq("slug", slug)
    .in("status", ["under_review", "reviewed"])
    .maybeSingle();

  if (error) throw new Error(`getPlayableCaseBySlug failed: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    category: data.category,
    status: data.status,
    disclaimer: data.disclaimer,
    caseSpec: data.case_spec as CaseSpec,
  };
}
