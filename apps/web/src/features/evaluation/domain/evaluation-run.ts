import { z } from "zod";

export const evaluationRunSchema = z.object({
  acceptanceRate: z.number().finite().min(0).max(1),
  createdAt: z.string().datetime(),
  id: z.string().min(1),
  orgId: z.string().min(1),
  outcomeRate: z.number().finite().min(0).max(1),
  promptFamily: z.string().min(1),
  recommendationCount: z.number().int().nonnegative(),
  version: z.literal("evaluation-run.v1"),
});

export type EvaluationRun = z.infer<typeof evaluationRunSchema>;

export function createEvaluationRun(
  input: Omit<EvaluationRun, "createdAt" | "version"> & { createdAt?: string },
): EvaluationRun {
  return evaluationRunSchema.parse({
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString(),
    version: "evaluation-run.v1",
  });
}
