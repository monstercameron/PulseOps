import { describe, expect, it, vi } from "vitest";
import { type Pool } from "pg";

import { createPostgresBillingAccountRepository } from "@/features/cost/repositories/postgres-billing-account-repository";
import { createPostgresBillingPaymentMethodRepository } from "@/features/cost/repositories/postgres-billing-payment-method-repository";
import { createPostgresLlmUsageEventRepository } from "@/features/cost/repositories/postgres-llm-usage-event-repository";

describe("postgres cost repository read fallbacks", () => {
  it("returns safe empty values when billing or usage tables are missing", async () => {
    const query = vi.fn().mockRejectedValue({ code: "42P01" });
    const pool = { query } as unknown as Pool;

    const billingAccountRepository = createPostgresBillingAccountRepository({
      pool,
    });
    const billingPaymentMethodRepository =
      createPostgresBillingPaymentMethodRepository({
        pool,
      });
    const llmUsageEventRepository = createPostgresLlmUsageEventRepository({
      pool,
    });

    await expect(billingAccountRepository.getByOrgId("org_123")).resolves.toBeNull();
    await expect(
      billingPaymentMethodRepository.getByOrgIdAndRole("org_123", "primary"),
    ).resolves.toBeNull();
    await expect(
      billingPaymentMethodRepository.listByOrgId("org_123"),
    ).resolves.toEqual([]);
    await expect(
      llmUsageEventRepository.listByOrgIdInPeriod({
        endAtExclusive: "2026-04-10T00:00:00.000Z",
        orgId: "org_123",
        startAtInclusive: "2026-04-09T00:00:00.000Z",
      }),
    ).resolves.toEqual([]);
  });
});
