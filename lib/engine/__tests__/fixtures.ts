import type { CaseSpec, Evolution } from "../types";

export const fixtureEvolution: Evolution = {
  id: "1.A",
  direction: "piora",
  narrative: "Fixture evolution for engine unit tests.",
  vitals: { pa: "72/40", fc: null, spo2: null },
  options: [
    { id: "a1", text: "Correct action 1", correct: true, rationale: "r1" },
    { id: "a2", text: "Correct action 2", correct: true, rationale: "r2" },
    { id: "a3", text: "Correct action 3", correct: true, rationale: "r3" },
    { id: "a4", text: "The critical error", correct: false, critical: true, rationale: "r4" },
    { id: "a5", text: "Incorrect action 2", correct: false, rationale: "r5" },
    { id: "a6", text: "Incorrect action 3", correct: false, rationale: "r6" },
  ],
};

export const fixtureCase: CaseSpec = {
  slug: "fixture-case",
  title: "Fixture Case",
  category: "Teste",
  disclaimer: "Fixture disclaimer.",
  baseCase: {
    narrative: "Fixture base case narrative.",
    vitals: { pa: "130/80", fc: 70, spo2: 98 },
    initialConductSeconds: 1,
  },
  evolutions: [fixtureEvolution],
  scoring: {
    perOptionCorrectlyClassified: 1,
    criticalIdentificationBonus: 2,
    perEvolutionMax: 8,
  },
};
