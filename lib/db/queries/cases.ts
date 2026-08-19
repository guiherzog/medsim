import type { SupabaseClient } from "@supabase/supabase-js";
import type { CaseSpec, CaseStatus } from "@/lib/engine/types";

export interface CaseListItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: CaseStatus;
}

export interface CaseRow extends CaseListItem {
  disclaimer: string;
  caseSpec: CaseSpec;
}

export async function listPlayableCases(supabase: SupabaseClient): Promise<CaseListItem[]> {
  const { data, error } = await supabase
    .from("cases")
    .select("id, slug, title, category, status")
    .in("status", ["under_review", "reviewed"])
    .order("title");

  if (error) throw new Error(`listPlayableCases failed: ${error.message}`);
  return data as CaseListItem[];
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
