import { z } from "zod";

const vitalsSchema = z.object({
  pa: z.string().nullable(),
  fc: z.number().nullable(),
  spo2: z.number().nullable(),
});

const optionSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  correct: z.boolean(),
  critical: z.boolean().optional(),
  rationale: z.string().min(1),
});

const evolutionSchema = z.object({
  id: z.string(),
  direction: z.enum(["piora", "melhora"]),
  narrative: z.string().min(1),
  vitals: vitalsSchema,
  options: z.array(optionSchema).length(6),
}).superRefine((evolution, ctx) => {
  const correctCount = evolution.options.filter((o) => o.correct).length;
  if (correctCount !== 3) {
    ctx.addIssue({
      code: "custom",
      message: `evolution ${evolution.id} must have exactly 3 correct options, got ${correctCount}`,
    });
  }

  const criticalOptions = evolution.options.filter((o) => o.critical);
  if (criticalOptions.length !== 1) {
    ctx.addIssue({
      code: "custom",
      message: `evolution ${evolution.id} must flag exactly 1 option as critical, got ${criticalOptions.length}`,
    });
  } else if (criticalOptions[0].correct) {
    ctx.addIssue({
      code: "custom",
      message: `evolution ${evolution.id}'s critical option must be one of the 3 incorrect options`,
    });
  }

  const ids = new Set(evolution.options.map((o) => o.id));
  if (ids.size !== evolution.options.length) {
    ctx.addIssue({
      code: "custom",
      message: `evolution ${evolution.id} has duplicate option ids`,
    });
  }
});

const baseCaseSchema = z.object({
  narrative: z.string().min(1),
  vitals: vitalsSchema,
  initialConductSeconds: z.number().int().positive(),
});

const approvalSchema = z.object({
  approvedBy: z.string().min(1).optional(),
  approvedAt: z.string().min(1).optional(),
});

const scoringSchema = z.object({
  perOptionCorrectlyClassified: z.number().positive(),
  criticalIdentificationBonus: z.number().positive(),
  perEvolutionMax: z.number().positive(),
});

export const caseSpecSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  disclaimer: z.string().min(1),
  approval: approvalSchema.optional(),
  baseCase: baseCaseSchema,
  evolutions: z.array(evolutionSchema).min(1),
  scoring: scoringSchema,
});

export type CaseSpecInput = z.infer<typeof caseSpecSchema>;
