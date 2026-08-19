// PROTOTYPE — throwaway. See PROTOTYPE_README.md.
// Hand-authored sim script for dor-toracica-iam-vd. The clinical content is
// taken from the real case YAML; the per-option consequences (vitals targets +
// feed lines) are new, and are exactly what the real CaseSpec lacks today.

export interface SimVitals {
  pa: string;
  fc: number;
  spo2: number;
  fr: number;
}

export type VitalKey = keyof SimVitals;

export interface SimOption {
  id: string;
  label: string;
  correct: boolean;
  critical?: boolean;
  /** Narrated into the feed after this choice. */
  feed: string;
  /** Authored target the vitals drift toward — no randomness. */
  target: SimVitals;
  /** Which reading is the one to worry about after this choice. */
  criticalVital: VitalKey | null;
  next: string | null;
  /** Placeholder for the mocks' "microvídeo · 3 min" card. No assets exist yet. */
  clip?: string;
}

export interface SimStep {
  id: string;
  /** Shown as the incoming situation in the feed. */
  event: string;
  prompt: string;
  vitals: SimVitals;
  criticalVital: VitalKey | null;
  /** Seconds to decide before the patient deteriorates on its own. */
  decisionSeconds: number;
  /** Authored consequence of not acting in time — the pressure has teeth. */
  timeout: {
    feed: string;
    target: SimVitals;
    criticalVital: VitalKey | null;
  };
  options: SimOption[];
}

/** The mocks' pre-case briefing ("Assumir o caso"). */
export const PROTOTYPE_BRIEFING = {
  category: "Cardiologia",
  title: "Dor torácica em homem de 58 anos",
  meta: "~4 min · difícil · IAM de parede inferior",
  patient: "Homem, 58 anos",
  patientDetail: "Hipertenso, tabagista (40 maços-ano) · dor há 40 min · supra de ST em DII, DIII, aVF",
  admissionVitals: { pa: "130/80", fc: 62, spo2: 96, fr: 18 } as SimVitals,
  note: "Você conduz em tempo real. Cada decisão altera os vitais — e a demora também.",
  decisions: 3,
};

export const PROTOTYPE_STEPS: SimStep[] = [
  {
    id: "1.A",
    event:
      "Nitrato sublingual administrado. O paciente evolui com hipotensão, palidez e turgência jugular. A dor persiste.",
    prompt: "PA em queda após o nitrato. Qual sua conduta agora?",
    vitals: { pa: "72/40", fc: 58, spo2: 92, fr: 22 },
    criticalVital: "pa",
    decisionSeconds: 30,
    timeout: {
      feed: "Nenhuma conduta tomada. A hipotensão progride sem reposição de volume.",
      target: { pa: "60/34", fc: 50, spo2: 87, fr: 27 },
      criticalVital: "pa",
    },
    options: [
      {
        id: "a1",
        label: "Suspender nitrato + cristaloide 500 mL em bólus",
        correct: true,
        feed: "Nitrato suspenso, volume infundido. A PA responde — perfusão periférica melhora.",
        target: { pa: "104/64", fc: 72, spo2: 95, fr: 18 },
        criticalVital: null,
        next: "1.B",
      },
      {
        id: "a2",
        label: "Repetir nitrato sublingual para a dor",
        correct: false,
        critical: true,
        feed: "A PA despenca. O VD infartado depende de volume — o nitrato tirou a pré-carga que sustentava o débito.",
        target: { pa: "58/32", fc: 48, spo2: 86, fr: 28 },
        criticalVital: "pa",
        next: "1.B",
        clip: "Infarto de VD: por que nitrato é armadilha (3 min)",
      },
      {
        id: "a3",
        label: "Furosemida IV presumindo congestão",
        correct: false,
        feed: "Diurese em paciente que precisava de volume. A PA cai mais.",
        target: { pa: "64/38", fc: 54, spo2: 89, fr: 26 },
        criticalVital: "pa",
        next: "1.B",
      },
      {
        id: "a4",
        label: "ECG com derivações direitas (V3R–V4R)",
        correct: true,
        feed: "Supra em V3R–V4R confirma infarto de ventrículo direito. Conduta redirecionada para volume.",
        target: { pa: "76/44", fc: 60, spo2: 92, fr: 22 },
        criticalVital: "pa",
        next: "1.B",
      },
    ],
  },
  {
    id: "1.B",
    event:
      "Durante o transporte para a hemodinâmica o paciente perde a consciência. Monitor: fibrilação ventricular. Pulso ausente.",
    prompt: "Ritmo chocável, sem pulso. Próxima ação?",
    vitals: { pa: "0/0", fc: 0, spo2: 0, fr: 0 },
    criticalVital: "fc",
    decisionSeconds: 12,
    timeout: {
      feed: "Nenhum choque entregue. Cada ciclo sem desfibrilação reduz a chance de retorno da circulação.",
      target: { pa: "0/0", fc: 0, spo2: 0, fr: 0 },
      criticalVital: "fc",
    },
    options: [
      {
        id: "b1",
        label: "Compressões + desfibrilação imediata (choque não sincronizado)",
        correct: true,
        feed: "Choque entregue no 2º ciclo. Retorno de circulação espontânea — ritmo sinusal.",
        target: { pa: "98/58", fc: 96, spo2: 94, fr: 20 },
        criticalVital: null,
        next: "1.C",
      },
      {
        id: "b2",
        label: "Cardioversão elétrica sincronizada",
        correct: false,
        critical: true,
        feed: "O aparelho não encontra QRS para sincronizar. Nenhum choque é entregue — segundos perdidos em ritmo chocável.",
        target: { pa: "0/0", fc: 0, spo2: 0, fr: 0 },
        criticalVital: "fc",
        next: "1.C",
        clip: "FV: desfibrilar, nunca sincronizar (3 min)",
      },
      {
        id: "b3",
        label: "Checar pulso e ritmo com calma antes de agir",
        correct: false,
        feed: "Checagem prolongada. Compressões interrompidas além dos 10 segundos recomendados.",
        target: { pa: "0/0", fc: 0, spo2: 0, fr: 0 },
        criticalVital: "fc",
        next: "1.C",
      },
    ],
  },
  {
    id: "1.C",
    event:
      "Angioplastia com stent em coronária direita, fluxo TIMI 3. Seis horas depois: assintomático, orientado, estável.",
    prompt: "Paciente estável no pós-procedimento. Conduta?",
    vitals: { pa: "118/76", fc: 74, spo2: 97, fr: 16 },
    criticalVital: null,
    decisionSeconds: 45,
    timeout: {
      feed: "Nenhuma definição de conduta. O paciente segue sem plano de seguimento definido.",
      target: { pa: "116/74", fc: 76, spo2: 96, fr: 17 },
      criticalVital: null,
    },
    options: [
      {
        id: "c1",
        label: "Manter dupla antiagregação + monitorização contínua",
        correct: true,
        feed: "Conduta mantida. Paciente segue monitorizado — risco de arritmia recorrente coberto.",
        target: { pa: "120/78", fc: 72, spo2: 98, fr: 16 },
        criticalVital: null,
        next: null,
      },
      {
        id: "c2",
        label: "Liberar para casa hoje, já que está assintomático",
        correct: false,
        critical: true,
        feed: "Alta precoce após parada cardíaca e IAM com supra reperfundido. Sem estratificação nem observação.",
        target: { pa: "118/76", fc: 74, spo2: 97, fr: 16 },
        criticalVital: null,
        next: null,
        clip: "Pós-parada: por que a alta precoce mata (3 min)",
      },
    ],
  },
];

export const FIRST_STEP_ID = PROTOTYPE_STEPS[0].id;
export const stepById = (id: string) => PROTOTYPE_STEPS.find((s) => s.id === id)!;
