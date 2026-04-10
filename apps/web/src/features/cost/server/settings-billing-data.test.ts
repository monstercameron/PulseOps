import { describe, expect, it } from "vitest";

import { createBillingAccount } from "@/features/cost/domain/billing-account";
import { createLlmUsageEvent } from "@/features/cost/domain/llm-usage-event";
import { getSettingsBillingData } from "@/features/cost/server/settings-billing-data";

describe("settings billing data", () => {
  it("summarizes the current billing period from tracked LLM usage", async () => {
    const billing = await getSettingsBillingData({
      billingAccountRepository: {
        async getByOrgId(orgId) {
          return createBillingAccount({
            billingAnchorDayOfMonth: 9,
            createdAt: "2026-04-01T00:00:00.000Z",
            id: orgId,
            monthlyPlatformFeeCents: 14_900,
            orgId,
            planName: "Growth",
            profitPremiumBasisPoints: 2_000,
            status: "active",
            updatedAt: "2026-04-01T00:00:00.000Z",
            usageCapCents: 50_000,
          });
        },
        async put(value) {
          return value;
        },
      },
      llmUsageEventRepository: {
        async listByOrgIdInPeriod() {
          return [
            createLlmUsageEvent({
              billableCostNanoUsd: 2_400_000_000,
              cachedInputTokens: 200,
              createdAt: "2026-04-10T12:00:00.000Z",
              feature: "extraction",
              id: "usage_1",
              inputTokens: 1_200,
              model: "gpt-5-mini",
              operation: "generic-document-extraction",
              orgId: "org_123",
              outputTokens: 900,
              pricingAvailable: true,
              pricingSource: "gpt-5-mini",
              pricingVersion: "openai-api-pricing-2026-04-09",
              profitPremiumBasisPoints: 2_000,
              provider: "openai",
              providerInputCostNanoUsd: 300_000_000,
              providerOutputCostNanoUsd: 1_700_000_000,
              providerTotalCostNanoUsd: 2_000_000_000,
              totalTokens: 2_100,
            }),
          ];
        },
        async put(value) {
          return value;
        },
      },
      now: () => "2026-04-11T09:00:00.000Z",
      orgId: "org_123",
    });

    expect(billing.planTitle).toBe("Growth plan");
    expect(billing.planDescription).toContain("Platform access plus usage-based billing.");
    expect(billing.graphMetrics).toEqual({
      currentTotalCents: 15_140,
      flatFeeCents: 14_900,
      usageThisPeriodCents: 240,
    });
    expect(billing.usageCapCents).toBe(50_000);
    expect(billing.usage).toEqual([
      {
        detail: "Monthly recurring",
        id: "flat_fee",
        label: "Platform access",
        value: "$149.00",
      },
      {
        detail: "1 tracked runs",
        id: "usage_this_period",
        label: "Usage this period",
        value: "$2.40",
      },
      {
        detail: "Renews May 9, 2026",
        id: "current_total",
        label: "Current total",
        value: "$151.40",
      },
    ]);
  });
});
