import { createDefaultBillingAccount } from "@/features/cost/domain/billing-account";
import { getBillingPeriodWindow } from "@/features/cost/domain/billing-period";
import {
  getBillingPaymentMethodBrandLabel,
  getBillingPaymentMethodRoleLabel,
} from "@/features/cost/domain/billing-payment-method";
import { type BillingAccountRepository } from "@/features/cost/repositories/billing-account-repository";
import { type BillingPaymentMethodRepository } from "@/features/cost/repositories/billing-payment-method-repository";
import { type LlmUsageEventRepository } from "@/features/cost/repositories/llm-usage-event-repository";
import { type SettingsPageData } from "@/features/settings/constants/settings-page-content";

type GetSettingsBillingDataInput = Readonly<{
  billingAccountRepository?: BillingAccountRepository;
  billingPaymentMethodRepository?: BillingPaymentMethodRepository;
  llmUsageEventRepository?: LlmUsageEventRepository;
  now?: () => string;
  orgId: string;
}>;

const integerFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

export async function getSettingsBillingData({
  billingAccountRepository,
  billingPaymentMethodRepository,
  llmUsageEventRepository,
  now = () => new Date().toISOString(),
  orgId,
}: GetSettingsBillingDataInput): Promise<SettingsPageData["billing"]> {
  const nowIso = now();
  const billingAccount =
    (await billingAccountRepository?.getByOrgId(orgId)) ??
    createDefaultBillingAccount(orgId, nowIso);
  const billingPeriod = getBillingPeriodWindow(
    nowIso,
    billingAccount.billingAnchorDayOfMonth,
  );
  const llmUsageEvents =
    (await llmUsageEventRepository?.listByOrgIdInPeriod({
      endAtExclusive: billingPeriod.endAt,
      orgId,
      startAtInclusive: billingPeriod.startAt,
    })) ?? [];
  const paymentMethods =
    ((await billingPaymentMethodRepository?.listByOrgId(orgId)) ?? []).sort(
      (left, right) =>
        getPaymentMethodSortRank(left.role) - getPaymentMethodSortRank(right.role),
    );
  const runCount = llmUsageEvents.length;
  const unpricedRunCount = llmUsageEvents.filter(
    (llmUsageEvent) => llmUsageEvent.pricingAvailable === false,
  ).length;
  const billableUsageNanoUsd = llmUsageEvents.reduce(
    (sum, llmUsageEvent) => sum + llmUsageEvent.billableCostNanoUsd,
    0,
  );
  const usageThisPeriodCents = nanoUsdToRoundedCents(billableUsageNanoUsd);
  const currentTotalCents =
    billingAccount.monthlyPlatformFeeCents + usageThisPeriodCents;
  const usage: SettingsPageData["billing"]["usage"] = [
    {
      detail: "Monthly recurring",
      id: "flat_fee",
      label: "Platform access",
      value: formatUsdFromCents(billingAccount.monthlyPlatformFeeCents),
    },
    {
      detail:
        unpricedRunCount > 0
          ? `${formatInteger(runCount)} tracked runs, ${formatInteger(unpricedRunCount)} settling`
          : `${formatInteger(runCount)} tracked runs`,
      id: "usage_this_period",
      label: "Usage this period",
      value: formatUsdFromNanoUsd(billableUsageNanoUsd),
    },
    {
      detail: `Renews ${formatDate(billingPeriod.endAt)}`,
      id: "current_total",
      label: "Current total",
      value: formatUsdFromCents(currentTotalCents),
    },
  ];

  return {
    graphMetrics: {
      currentTotalCents,
      flatFeeCents: billingAccount.monthlyPlatformFeeCents,
      usageThisPeriodCents,
    },
    paymentMethods: paymentMethods.map((paymentMethod) => ({
      brandLabel: getBillingPaymentMethodBrandLabel(paymentMethod.brand),
      cardholderName: paymentMethod.cardholderName,
      expMonth: paymentMethod.expMonth,
      expYear: paymentMethod.expYear,
      id: paymentMethod.id,
      last4: paymentMethod.last4,
      postalCode: paymentMethod.postalCode,
      role: paymentMethod.role,
      roleLabel: getBillingPaymentMethodRoleLabel(paymentMethod.role),
    })),
    planDescription: [
      "Platform access plus usage-based billing.",
      `Current cycle ${formatDate(billingPeriod.startAt)} to ${formatDate(billingPeriod.endAt)}.`,
    ].join(" "),
    planTitle: `${billingAccount.planName} plan`,
    usage,
    usageCapCents: billingAccount.usageCapCents,
  };
}

function nanoUsdToRoundedCents(value: number): number {
  return Math.round(value / 10_000_000);
}

function formatDate(isoTimestamp: string): string {
  return dateFormatter.format(new Date(isoTimestamp));
}

function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

function formatUsdFromCents(value: number): string {
  return currencyFormatter.format(value / 100);
}

function formatUsdFromNanoUsd(value: number): string {
  return currencyFormatter.format(value / 1_000_000_000);
}

function getPaymentMethodSortRank(role: "backup" | "primary") {
  return role === "primary" ? 0 : 1;
}
