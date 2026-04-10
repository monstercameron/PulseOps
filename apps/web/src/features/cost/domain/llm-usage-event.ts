import { z } from "zod";

export const llmUsageEventSchema = z.object({
  billableCostNanoUsd: z.number().int().nonnegative(),
  cachedInputTokens: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  documentId: z.string().min(1).optional(),
  feature: z.string().min(1),
  id: z.string().min(1),
  inputTokens: z.number().int().nonnegative(),
  model: z.string().min(1),
  operation: z.string().min(1),
  orgId: z.string().min(1),
  outputTokens: z.number().int().nonnegative(),
  pricingAvailable: z.boolean(),
  pricingSource: z.string().min(1).optional(),
  pricingVersion: z.string().min(1).optional(),
  profitPremiumBasisPoints: z.number().int().min(0).max(100_000),
  provider: z.enum(["openai"]),
  providerInputCostNanoUsd: z.number().int().nonnegative(),
  providerOutputCostNanoUsd: z.number().int().nonnegative(),
  providerTotalCostNanoUsd: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  version: z.literal("llm-usage-event.v1"),
});

export type LlmUsageEvent = z.infer<typeof llmUsageEventSchema>;

type CreateLlmUsageEventInput = Omit<LlmUsageEvent, "version">;

export function createLlmUsageEvent(
  input: CreateLlmUsageEventInput,
): LlmUsageEvent {
  return llmUsageEventSchema.parse({
    ...input,
    version: "llm-usage-event.v1",
  });
}
