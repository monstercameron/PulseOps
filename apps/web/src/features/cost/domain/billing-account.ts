import { z } from "zod";

export const DEFAULT_BILLING_PLAN_NAME = "Growth";
export const DEFAULT_BILLING_CURRENCY = "USD";
export const DEFAULT_MONTHLY_PLATFORM_FEE_CENTS = 14_900;
export const DEFAULT_PROFIT_PREMIUM_BASIS_POINTS = 2_000;
export const DEFAULT_BILLING_ANCHOR_DAY_OF_MONTH = 9;

export const billingAccountStatusSchema = z.enum(["active", "past_due", "trial"]);

export const billingAccountSchema = z.object({
  billingAnchorDayOfMonth: z.number().int().min(1).max(28),
  createdAt: z.string().datetime(),
  currency: z.literal(DEFAULT_BILLING_CURRENCY),
  id: z.string().min(1),
  monthlyPlatformFeeCents: z.number().int().nonnegative(),
  orgId: z.string().min(1),
  planName: z.string().min(1),
  profitPremiumBasisPoints: z.number().int().min(0).max(100_000),
  status: billingAccountStatusSchema,
  updatedAt: z.string().datetime(),
  usageCapCents: z.number().int().nonnegative().nullable().default(null),
  version: z.literal("billing-account.v1"),
});

export type BillingAccount = z.infer<typeof billingAccountSchema>;

type CreateBillingAccountInput = Omit<
  BillingAccount,
  "createdAt" | "currency" | "updatedAt" | "usageCapCents" | "version"
> & {
  createdAt?: string;
  updatedAt?: string;
  usageCapCents?: number | null;
};

export function createBillingAccount(
  input: CreateBillingAccountInput,
): BillingAccount {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return billingAccountSchema.parse({
    ...input,
    createdAt,
    currency: DEFAULT_BILLING_CURRENCY,
    updatedAt: input.updatedAt ?? createdAt,
    version: "billing-account.v1",
  });
}

export function createDefaultBillingAccount(
  orgId: string,
  timestamp = new Date().toISOString(),
): BillingAccount {
  return createBillingAccount({
    billingAnchorDayOfMonth: DEFAULT_BILLING_ANCHOR_DAY_OF_MONTH,
    createdAt: timestamp,
    id: orgId,
    monthlyPlatformFeeCents: DEFAULT_MONTHLY_PLATFORM_FEE_CENTS,
    orgId,
    planName: DEFAULT_BILLING_PLAN_NAME,
    profitPremiumBasisPoints: DEFAULT_PROFIT_PREMIUM_BASIS_POINTS,
    status: "active",
    updatedAt: timestamp,
    usageCapCents: null,
  });
}
