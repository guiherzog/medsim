import { z } from "zod";

const vitalsSchema = z.object({
  pa: z.string().min(1),
  fc: z.number().int().min(0),
  spo2: z.number().int().min(0),
  fr: z.number().int().min(0),
});

const vitalKeySchema = z.enum(["pa", "fc", "spo2", "fr"]);

const consequenceSchema = z.object({
  feed: z.string().min(1),
  target: vitalsSchema,
  criticalVital: vitalKeySchema.nullable(),
});

const optionSchema = consequenceSchema.extend({
  id: z.string().min(1),
  label: z.string().min(1),
  correct: z.boolean(),
  critical: z.boolean().optional(),
  rationale: z.string().min(1),
  clip: z.string().min(1).optional(),
  next: z.string().min(1).nullable(),
});

const stepSchema = z
  .object({
    id: z.string().min(1),
    event: z.string().min(1),
    prompt: z.string().min(1),
    vitals: vitalsSchema,
    criticalVital: vitalKeySchema.nullable(),
    decisionSeconds: z.number().int().positive(),
    timeout: consequenceSchema,
    options: z.array(optionSchema).min(2),
  })
  .superRefine((step, ctx) => {
    if (!step.options.some((o) => o.correct)) {
      ctx.addIssue({ code: "custom", message: `step ${step.id} has no correct option` });
    }
    const critical = step.options.filter((o) => o.critical);
    if (critical.length > 1) {
      ctx.addIssue({
        code: "custom",
        message: `step ${step.id} flags ${critical.length} critical options, at most 1 allowed`,
      });
    }
    if (critical.some((o) => o.correct)) {
      ctx.addIssue({
        code: "custom",
        message: `step ${step.id}'s critical option cannot also be correct`,
      });
    }
    if (new Set(step.options.map((o) => o.id)).size !== step.options.length) {
      ctx.addIssue({ code: "custom", message: `step ${step.id} has duplicate option ids` });
    }
  });

export const caseSpecSchema = z
  .object({
    slug: z.string().min(1),
    title: z.string().min(1),
    category: z.string().min(1),
    disclaimer: z.string().min(1),
    approval: z
      .object({
        approvedBy: z.string().min(1).optional(),
        approvedAt: z.string().min(1).optional(),
      })
      .optional(),
    briefing: z.object({
      patient: z.string().min(1),
      patientDetail: z.string().min(1),
      meta: z.string().min(1),
      admissionVitals: vitalsSchema,
      note: z.string().min(1),
    }),
    steps: z.array(stepSchema).min(1),
    scoring: z.object({
      pointsPerCorrectDecision: z.number().positive(),
      criticalErrorPenalty: z.number().min(0),
      timeoutPenalty: z.number().min(0),
    }),
  })
  .superRefine((spec, ctx) => {
    const ids = new Set(spec.steps.map((s) => s.id));
    if (ids.size !== spec.steps.length) {
      ctx.addIssue({ code: "custom", message: "duplicate step ids" });
    }
    // Every `next` must resolve, or the run can dead-end mid-case.
    for (const step of spec.steps) {
      const targets = [...step.options.map((o) => o.next)];
      for (const next of targets) {
        if (next !== null && !ids.has(next)) {
          ctx.addIssue({
            code: "custom",
            message: `step ${step.id} points at unknown step "${next}"`,
          });
        }
      }
    }
  });

export type CaseSpecInput = z.infer<typeof caseSpecSchema>;
