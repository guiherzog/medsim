import { describe, expect, it } from "vitest";
import { caseSpecSchema } from "../caseSpec.schema";
import { fixtureCase } from "./fixtures";

describe("caseSpecSchema", () => {
  it("accepts a valid case spec", () => {
    const result = caseSpecSchema.safeParse(fixtureCase);
    expect(result.success).toBe(true);
  });

  it("rejects an evolution without exactly 3 correct options", () => {
    const invalid = structuredClone(fixtureCase);
    invalid.evolutions[0].options[0].correct = false; // now only 2 correct
    const result = caseSpecSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects an evolution with no critical option", () => {
    const invalid = structuredClone(fixtureCase);
    invalid.evolutions[0].options[3].critical = false;
    const result = caseSpecSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects a critical option that is also marked correct", () => {
    const invalid = structuredClone(fixtureCase);
    invalid.evolutions[0].options[3].correct = true; // critical option a4 now claims to be correct
    invalid.evolutions[0].options[0].correct = false; // keep the correct-count at 3
    const result = caseSpecSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects an option missing rationale", () => {
    const invalid = structuredClone(fixtureCase);
    invalid.evolutions[0].options[0].rationale = "";
    const result = caseSpecSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
