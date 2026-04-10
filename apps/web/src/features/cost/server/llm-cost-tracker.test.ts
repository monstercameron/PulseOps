import { describe, expect, it, vi } from "vitest";

import { createBillingAccount } from "@/features/cost/domain/billing-account";
import {
  createLlmCostTracker,
  LLM_USAGE_CAP_REACHED_MESSAGE,
} from "@/features/cost/server/llm-cost-tracker";

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

  it("blocks new requests after the usage cap is reached", async () => {
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
            usageCapCents: 200,
          });
        },
        async put(value) {
          return value;
        },
      },
      llmUsageEventRepository: {
        async listByOrgIdInPeriod() {
          return [
            {
              billableCostNanoUsd: 2_000_000_000,
              cachedInputTokens: 0,
              createdAt: "2026-04-09T12:00:00.000Z",
              feature: "extraction",
              id: "usage_1",
              inputTokens: 100,
              model: "gpt-5-mini",
              operation: "generic-document-extraction",
              orgId: "org_123",
              outputTokens: 50,
              pricingAvailable: true,
              pricingSource: "gpt-5-mini",
              pricingVersion: "openai-api-pricing-2026-04-09",
              profitPremiumBasisPoints: 2_500,
              provider: "openai" as const,
              providerInputCostNanoUsd: 10,
              providerOutputCostNanoUsd: 20,
              providerTotalCostNanoUsd: 30,
              totalTokens: 150,
              version: "llm-usage-event.v1" as const,
            },
          ];
        },
        async put(value) {
          return value;
        },
      },
      now: () => "2026-04-10T12:00:00.000Z",
    });

    await expect(
      tracker.assertWithinUsageCap({
        context: {
          feature: "extraction",
          operation: "generic-document-extraction",
          orgId: "org_123",
        },
      }),
    ).rejects.toThrow(LLM_USAGE_CAP_REACHED_MESSAGE);
  });
});
