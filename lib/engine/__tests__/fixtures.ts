import type { CaseSpec, Vitals } from "../types";

export const NORMAL_VITALS: Vitals = { pa: "120/78", fc: 74, spo2: 98, fr: 16 };

/** Two steps: one with a critical option, one terminal. Enough to exercise scoring. */
export const fixtureCase: CaseSpec = {
  slug: "fixture",
  title: "Fixture",
  category: "Teste",
  disclaimer: "Fixture disclaimer.",
  briefing: {
    patient: "Homem, 50 anos",
    patientDetail: "Fixture detail",
    meta: "~1 min · teste",
    admissionVitals: NORMAL_VITALS,
    note: "Fixture note.",
  },
  steps: [
    {
      id: "s1",
      event: "Situação inicial.",
      prompt: "Conduta?",
      vitals: { pa: "72/40", fc: 58, spo2: 92, fr: 22 },
      criticalVital: "pa",
      decisionSeconds: 20,
      timeout: {
        feed: "Nada foi feito.",
        target: { pa: "60/34", fc: 50, spo2: 87, fr: 27 },
        criticalVital: "pa",
      },
      options: [
        {
          id: "s1a",
          label: "Conduta correta",
          correct: true,
          rationale: "Porque sim.",
          feed: "Melhora.",
          target: { pa: "104/64", fc: 72, spo2: 96, fr: 18 },
          criticalVital: null,
          next: "s2",
        },
        {
          id: "s1b",
          label: "Erro grave",
          correct: false,
          critical: true,
          rationale: "Porque piora.",
          feed: "Piora muito.",
          target: { pa: "58/32", fc: 48, spo2: 86, fr: 28 },
          criticalVital: "pa",
          next: "s2",
        },
        {
          id: "s1c",
          label: "Conduta inócua",
          correct: false,
          rationale: "Não ajuda.",
          feed: "Sem mudança relevante.",
          target: { pa: "74/42", fc: 58, spo2: 91, fr: 22 },
          criticalVital: "pa",
          next: "s2",
        },
      ],
    },
    {
      id: "s2",
      event: "Situação final.",
      prompt: "Conduta?",
      vitals: NORMAL_VITALS,
      criticalVital: null,
      decisionSeconds: 30,
      timeout: {
        feed: "Sem definição.",
        target: NORMAL_VITALS,
        criticalVital: null,
      },
      options: [
        {
          id: "s2a",
          label: "Correta",
          correct: true,
          rationale: "Certo.",
          feed: "Estável.",
          target: NORMAL_VITALS,
          criticalVital: null,
          next: null,
        },
        {
          id: "s2b",
          label: "Errada",
          correct: false,
          rationale: "Errado.",
          feed: "Segue instável.",
          target: { pa: "100/62", fc: 88, spo2: 94, fr: 20 },
          criticalVital: null,
          next: null,
        },
      ],
    },
  ],
  scoring: {
    pointsPerCorrectDecision: 10,
    criticalErrorPenalty: 5,
    timeoutPenalty: 5,
  },
};
