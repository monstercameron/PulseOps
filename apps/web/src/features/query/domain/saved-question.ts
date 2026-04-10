import { z } from "zod";

import { queryPlanSchema } from "@/features/query/domain/query-plan";

export const savedQuestionSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.string().min(1),
  orgId: z.string().min(1),
  question: z.string().min(1),
  queryPlan: queryPlanSchema,
  version: z.literal("saved-question.v1"),
});

export type SavedQuestion = z.infer<typeof savedQuestionSchema>;

type CreateSavedQuestionInput = Omit<SavedQuestion, "createdAt" | "version"> & {
  createdAt?: string;
};

export function createSavedQuestion(
  input: CreateSavedQuestionInput,
): SavedQuestion {
  return savedQuestionSchema.parse({
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString(),
    version: "saved-question.v1",
  });
}
