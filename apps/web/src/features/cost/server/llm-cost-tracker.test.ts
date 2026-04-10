import { describe, expect, it, vi } from "vitest";

import { createBillingAccount } from "@/features/cost/domain/billing-account";
import { createLlmCostTracker } from "@/features/cost/server/llm-cost-tracker";

describe("llm cost tracker", () => {
  it("records token usage with provider and billable costs", async () => {
    const put = vi.fn(async (value) => value);
    const tracker = createLlmCostTracker({
      billingAccountRepository: {
        async getByOrgId(orgId) {
          return createBillingAccount({
            billingAnchorDayOfMonth: 9,
            createdAt: "2026-04-09T10:00:00.000Z",
            id: orgId,
            monthlyPlatformFeeCents: 14_900,
            orgId,
            planName: "Growth",
            profitPremiumBasisPoints: 2_500,
            status: "active",
            updatedAt: "2026-04-09T10:00:00.000Z",
          });
        },
        async put(value) {
          return value;
        },
      },
      llmUsageEventRepository: {
        listByOrgIdInPeriod: async () => [],
        put,
      },
      now: () => "2026-04-09T12:00:00.000Z",
    });

    await tracker.recordOpenAiResponse({
      context: {
        documentId: "doc_123",
        feature: "extraction",
        operation: "generic-document-extraction",
        orgId: "org_123",
      },
      model: "gpt-5-mini",
      response: {
        usage: {
          input_tokens: 1_000,
          input_tokens_details: {
            cached_tokens: 100,
          },
          output_tokens: 500,
          total_tokens: 1_500,
        },
      },
    });

    expect(put).toHaveBeenCalledWith(
      expect.objectContaining({
        billableCostNanoUsd: 1_534_375,
        cachedInputTokens: 100,
        documentId: "doc_123",
        feature: "extraction",
        inputTokens: 1_000,
        model: "gpt-5-mini",
        operation: "generic-document-extraction",
        orgId: "org_123",
        outputTokens: 500,
        pricingAvailable: true,
        pricingSource: "gpt-5-mini",
        pricingVersion: "openai-api-pricing-2026-04-09",
        profitPremiumBasisPoints: 2_500,
        providerInputCostNanoUsd: 227_500,
        providerOutputCostNanoUsd: 1_000_000,
        providerTotalCostNanoUsd: 1_227_500,
        totalTokens: 1_500,
      }),
    );
  });
});
