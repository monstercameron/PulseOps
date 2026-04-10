import { describe, expect, it } from "vitest";

import {
  createMaskedBillingPaymentMethod,
  getBillingPaymentMethodBrandLabel,
  getBillingPaymentMethodRoleLabel,
} from "@/features/cost/domain/billing-payment-method";

describe("billing payment method", () => {
  it("stores masked card metadata only", () => {
    expect(
      createMaskedBillingPaymentMethod({
        entry: {
          cardNumber: "4242 4242 4242 4242",
          cardholderName: "Broward HVAC Co.",
          cvc: "123",
          expMonth: 5,
          expYear: 2028,
          postalCode: "33301",
        },
        now: "2026-04-10T00:00:00.000Z",
        orgId: "org_123",
        role: "primary",
      }),
    ).toMatchObject({
      brand: "visa",
      cardholderName: "Broward HVAC Co.",
      expMonth: 5,
      expYear: 2028,
      last4: "4242",
      orgId: "org_123",
      postalCode: "33301",
      role: "primary",
    });
  });

  it("rejects invalid card numbers", () => {
    expect(() =>
      createMaskedBillingPaymentMethod({
        entry: {
          cardNumber: "4242 4242 4242 4241",
          cardholderName: "Broward HVAC Co.",
          cvc: "123",
          expMonth: 5,
          expYear: 2028,
          postalCode: "33301",
        },
        now: "2026-04-10T00:00:00.000Z",
        orgId: "org_123",
        role: "primary",
      }),
    ).toThrow("Enter a valid card number.");
  });

  it("exposes stable display labels", () => {
    expect(getBillingPaymentMethodRoleLabel("primary")).toBe("Business card");
    expect(getBillingPaymentMethodRoleLabel("backup")).toBe("Backup card");
    expect(getBillingPaymentMethodBrandLabel("visa")).toBe("Visa");
  });
});
