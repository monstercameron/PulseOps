import { randomUUID } from "node:crypto";

import { createDefaultBillingAccount } from "@/features/cost/domain/billing-account";
import { getBillingPeriodWindow } from "@/features/cost/domain/billing-period";
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

export const LLM_USAGE_CAP_REACHED_MESSAGE =
  "The workspace AI usage cap has been reached for the current billing period.";

export interface LlmCostTracker {
  assertWithinUsageCap(input: Readonly<{
    context: LlmUsageTrackingContext;
  }>): Promise<void>;
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
    async assertWithinUsageCap({ context }) {
      if (llmUsageEventRepository === undefined) {
        return;
      }

      const nowIso = now();
      const billingAccount =
        (await billingAccountRepository?.getByOrgId(context.orgId)) ??
        createDefaultBillingAccount(context.orgId, nowIso);

      if (billingAccount.usageCapCents === null) {
        return;
      }

      const billingPeriod = getBillingPeriodWindow(
        nowIso,
        billingAccount.billingAnchorDayOfMonth,
      );
      const llmUsageEvents = await llmUsageEventRepository.listByOrgIdInPeriod({
        endAtExclusive: billingPeriod.endAt,
        orgId: context.orgId,
        startAtInclusive: billingPeriod.startAt,
      });
      const currentUsageNanoUsd = llmUsageEvents.reduce(
        (sum, llmUsageEvent) => sum + llmUsageEvent.billableCostNanoUsd,
        0,
      );
      const usageCapNanoUsd = centsToNanoUsd(billingAccount.usageCapCents);

      if (currentUsageNanoUsd < usageCapNanoUsd) {
        return;
      }

      emitStructuredLog({
        data: {
          billingPeriodEndAt: billingPeriod.endAt,
          billingPeriodStartAt: billingPeriod.startAt,
          currentUsageNanoUsd,
          usageCapNanoUsd,
        },
        documentId: context.documentId,
        feature: "cost",
        level: "warn",
        message: "Blocked LLM request because the workspace usage cap was reached.",
        orgId: context.orgId,
        service: "web",
      });

      throw new Error(LLM_USAGE_CAP_REACHED_MESSAGE);
    },
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
      const nowIso = now();
      const billingAccount =
        (await billingAccountRepository?.getByOrgId(context.orgId)) ??
        createDefaultBillingAccount(context.orgId, nowIso);
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
        createdAt: nowIso,
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

function centsToNanoUsd(cents: number): number {
  return cents * 10_000_000;
}

function applyProfitPremium(
  providerTotalCostNanoUsd: number,
  profitPremiumBasisPoints: number,
): number {
  return Math.round(
    (providerTotalCostNanoUsd * (10_000 + profitPremiumBasisPoints)) / 10_000,
  );
}
