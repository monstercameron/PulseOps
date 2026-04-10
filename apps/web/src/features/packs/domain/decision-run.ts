import { z } from "zod";

export const decisionRunStatusSchema = z.enum([
  "queued",
  "running",
  "completed",
  "failed",
]);

export const decisionRunSchema = z.object({
  completedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  failureReason: z.string().min(1).optional(),
  id: z.string().min(1),
  orgId: z.string().min(1),
  packId: z.string().min(1).optional(),
  packKey: z.string().min(1),
  recommendationCount: z.number().int().nonnegative(),
  sourceDocumentIds: z.array(z.string().min(1)).readonly(),
  startedAt: z.string().datetime().optional(),
  status: decisionRunStatusSchema,
  summary: z.string().min(1),
  supportingFactIds: z.array(z.string().min(1)).readonly(),
  updatedAt: z.string().datetime(),
  version: z.literal("decision-run.v1"),
});

export type DecisionRun = z.infer<typeof decisionRunSchema>;

type CreateDecisionRunInput = Omit<
  DecisionRun,
  "createdAt" | "updatedAt" | "version"
> & {
  createdAt?: string;
  updatedAt?: string;
};

export function createDecisionRun(input: CreateDecisionRunInput): DecisionRun {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return decisionRunSchema.parse({
    ...input,
    createdAt,
    updatedAt: input.updatedAt ?? createdAt,
    version: "decision-run.v1",
  });
}
