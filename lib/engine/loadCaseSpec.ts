import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { caseSpecSchema } from "./caseSpec.schema";
import type { CaseSpec } from "./types";

export function parseCaseSpec(yamlText: string): CaseSpec {
  const raw = parse(yamlText);
  const result = caseSpecSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`invalid case spec: ${result.error.message}`);
  }
  return result.data as CaseSpec;
}

export function loadCaseSpec(filePath: string): CaseSpec {
  return parseCaseSpec(readFileSync(filePath, "utf-8"));
}
