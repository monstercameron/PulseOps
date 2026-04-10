import { z } from "zod";

export const recommendationRecordStatusSchema = z.enum([
  "open",
  "accepted",
  "rejected",
  "implemented",
  "dismissed",
]);

export const recommendationRecordSchema = z.object({
  actions: z.array(z.string().min(1)).readonly(),
  citations: z.array(z.string().min(1)).readonly(),
  confidenceScore: z.number().min(0).max(1),
  createdAt: z.string().datetime(),
  decisionRunId: z.string().min(1),
  id: z.string().min(1),
  kind: z.string().min(1),
  orgId: z.string().min(1),
  priorityScore: z.number().finite(),
  status: recommendationRecordStatusSchema,
  summary: z.string().min(1),
  supportingFactIds: z.array(z.string().min(1)).readonly(),
  title: z.string().min(1),
  updatedAt: z.string().datetime(),
  version: z.literal("recommendation-record.v1"),
});

export type RecommendationRecord = z.infer<typeof recommendationRecordSchema>;

type CreateRecommendationRecordInput = Omit<
  RecommendationRecord,
  "createdAt" | "updatedAt" | "version"
> & {
  createdAt?: string;
  updatedAt?: string;
};

export function createRecommendationRecord(
  input: CreateRecommendationRecordInput,
): RecommendationRecord {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return recommendationRecordSchema.parse({
    ...input,
    createdAt,
    updatedAt: input.updatedAt ?? createdAt,
    version: "recommendation-record.v1",
  });
}
