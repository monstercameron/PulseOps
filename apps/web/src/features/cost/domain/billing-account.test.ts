import { describe, expect, it } from "vitest";

import {
  DEFAULT_BILLING_ANCHOR_DAY_OF_MONTH,
  DEFAULT_MONTHLY_PLATFORM_FEE_CENTS,
  DEFAULT_PROFIT_PREMIUM_BASIS_POINTS,
  createDefaultBillingAccount,
} from "@/features/cost/domain/billing-account";

describe("billing account", () => {
  it("creates the default platform fee and leaves the usage cap unset", () => {
    expect(
      createDefaultBillingAccount("org_123", "2026-04-09T12:00:00.000Z"),
    ).toMatchObject({
      billingAnchorDayOfMonth: DEFAULT_BILLING_ANCHOR_DAY_OF_MONTH,
      monthlyPlatformFeeCents: DEFAULT_MONTHLY_PLATFORM_FEE_CENTS,
      orgId: "org_123",
      profitPremiumBasisPoints: DEFAULT_PROFIT_PREMIUM_BASIS_POINTS,
      status: "active",
      usageCapCents: null,
    });
  });
});
