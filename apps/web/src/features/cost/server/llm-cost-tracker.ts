import { randomUUID } from "node:crypto";

import { createDefaultBillingAccount } from "@/features/cost/domain/billing-account";
import { createLlmUsageEvent } from "@/features/cost/domain/llm-usage-event";
import { estimateOpenAiUsageCost } from "@/features/cost/domain/openai-model-pricing";
import { type BillingAccountRepository } from "@/features/cost/repositories/billing-account-repository";
import { type LlmUsageEventRepository } from "@/features/cost/repositories/llm-usage-event-repository";
import { emitStructuredLog } from "@/features/observability/lib/structured-logger";

export type LlmUsageTrackingContext = Readonly<{
  documentId?: string;
  feature: string;
  operation: string;
  orgId: string;
}>;

type OpenAiUsageEnvelope = Readonly<{
  usage?: {
    input_tokens?: number | null;
    input_tokens_details?: {
      cached_tokens?: number | null;
    } | null;
    output_tokens?: number | null;
    total_tokens?: number | null;
  } | null;
}>;

type CreateLlmCostTrackerInput = Readonly<{
  billingAccountRepository?: BillingAccountRepository;
  llmUsageEventRepository?: LlmUsageEventRepository;
  now?: () => string;
}>;

export interface LlmCostTracker {
  recordOpenAiResponse(input: Readonly<{
    context: LlmUsageTrackingContext;
    model: string;
    response: OpenAiUsageEnvelope;
  }>): Promise<void>;
}

export function createLlmCostTracker({
  billingAccountRepository,
  llmUsageEventRepository,
  now = () => new Date().toISOString(),
}: CreateLlmCostTrackerInput): LlmCostTracker {
  return {
    async recordOpenAiResponse({ context, model, response }) {
      const usage = response.usage;

      if (usage === undefined || usage === null || llmUsageEventRepository === undefined) {
        return;
      }

      const inputTokens = Math.max(usage.input_tokens ?? 0, 0);
      const cachedInputTokens = Math.max(
        usage.input_tokens_details?.cached_tokens ?? 0,
        0,
      );
      const outputTokens = Math.max(usage.output_tokens ?? 0, 0);
      const totalTokens = Math.max(
        usage.total_tokens ?? inputTokens + outputTokens,
        0,
      );
      const billingAccount =
        (await billingAccountRepository?.getByOrgId(context.orgId)) ??
        createDefaultBillingAccount(context.orgId, now());
      const usageCostEstimate = estimateOpenAiUsageCost({
        cachedInputTokens,
        inputTokens,
        model,
        outputTokens,
      });
      const billableCostNanoUsd = applyProfitPremium(
        usageCostEstimate.totalCostNanoUsd,
        billingAccount.profitPremiumBasisPoints,
      );
      const usageEvent = createLlmUsageEvent({
        billableCostNanoUsd,
        cachedInputTokens,
        createdAt: now(),
        documentId: context.documentId,
        feature: context.feature,
        id: `llm_usage_${randomUUID().replace(/-/g, "")}`,
        inputTokens,
        model,
        operation: context.operation,
        orgId: context.orgId,
        outputTokens,
        pricingAvailable: usageCostEstimate.pricing !== null,
        pricingSource: usageCostEstimate.pricing?.modelFamily,
        pricingVersion: usageCostEstimate.pricing?.pricingVersion,
        profitPremiumBasisPoints: billingAccount.profitPremiumBasisPoints,
        provider: "openai",
        providerInputCostNanoUsd: usageCostEstimate.inputCostNanoUsd,
        providerOutputCostNanoUsd: usageCostEstimate.outputCostNanoUsd,
        providerTotalCostNanoUsd: usageCostEstimate.totalCostNanoUsd,
        totalTokens,
      });

      await llmUsageEventRepository.put(usageEvent);

      emitStructuredLog({
        data: {
          billableCostNanoUsd,
          inputTokens,
          model,
          outputTokens,
          pricingAvailable: usageEvent.pricingAvailable,
          providerTotalCostNanoUsd: usageEvent.providerTotalCostNanoUsd,
          totalTokens,
        },
        documentId: context.documentId,
        feature: "cost",
        level: usageEvent.pricingAvailable ? "info" : "warn",
        message: usageEvent.pricingAvailable
          ? "Recorded LLM usage event."
          : "Recorded LLM usage event without a pricing match.",
        orgId: context.orgId,
        service: "web",
      });
    },
  };
}

function applyProfitPremium(
  providerTotalCostNanoUsd: number,
  profitPremiumBasisPoints: number,
): number {
  return Math.round(
    (providerTotalCostNanoUsd * (10_000 + profitPremiumBasisPoints)) / 10_000,
  );
}
