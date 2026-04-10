import { createDefaultBillingAccount } from "@/features/cost/domain/billing-account";
import { type BillingAccountRepository } from "@/features/cost/repositories/billing-account-repository";
import { type LlmUsageEventRepository } from "@/features/cost/repositories/llm-usage-event-repository";
import { type SettingsPageData } from "@/features/settings/constants/settings-page-content";

type GetSettingsBillingDataInput = Readonly<{
  billingAccountRepository?: BillingAccountRepository;
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
  const runCount = llmUsageEvents.length;
  const unpricedRunCount = llmUsageEvents.filter(
    (llmUsageEvent) => llmUsageEvent.pricingAvailable === false,
  ).length;
  const inputTokens = llmUsageEvents.reduce(
    (sum, llmUsageEvent) => sum + llmUsageEvent.inputTokens,
    0,
  );
  const cachedInputTokens = llmUsageEvents.reduce(
    (sum, llmUsageEvent) => sum + llmUsageEvent.cachedInputTokens,
    0,
  );
  const outputTokens = llmUsageEvents.reduce(
    (sum, llmUsageEvent) => sum + llmUsageEvent.outputTokens,
    0,
  );
  const totalTokens = llmUsageEvents.reduce(
    (sum, llmUsageEvent) => sum + llmUsageEvent.totalTokens,
    0,
  );
  const providerCostNanoUsd = llmUsageEvents.reduce(
    (sum, llmUsageEvent) => sum + llmUsageEvent.providerTotalCostNanoUsd,
    0,
  );
  const billableUsageNanoUsd = llmUsageEvents.reduce(
    (sum, llmUsageEvent) => sum + llmUsageEvent.billableCostNanoUsd,
    0,
  );
  const estimatedCurrentTotalNanoUsd =
    centsToNanoUsd(billingAccount.monthlyPlatformFeeCents) + billableUsageNanoUsd;
  const baseUsage = [
    {
      detail: "Monthly recurring",
      label: "Platform access fee",
      value: formatUsdFromCents(billingAccount.monthlyPlatformFeeCents),
    },
    {
      detail: `${formatInteger(cachedInputTokens)} cached`,
      label: "Prompt tokens",
      value: formatInteger(inputTokens),
    },
    {
      detail: `${formatInteger(totalTokens)} total`,
      label: "Generated tokens",
      value: formatInteger(outputTokens),
    },
    {
      detail: `${formatInteger(runCount)} tracked runs`,
      label: "Provider AI cost",
      value: formatUsdFromNanoUsd(providerCostNanoUsd),
    },
    {
      detail: `Cost + ${formatBasisPointsAsPercentage(billingAccount.profitPremiumBasisPoints)} premium`,
      label: "Billable AI usage",
      value: formatUsdFromNanoUsd(billableUsageNanoUsd),
    },
    {
      detail: `Renews ${formatDate(billingPeriod.endAt)}`,
      label: "Estimated current total",
      value: formatUsdFromNanoUsd(estimatedCurrentTotalNanoUsd),
    },
  ];
  const usage: SettingsPageData["billing"]["usage"] =
    unpricedRunCount > 0
      ? [
          ...baseUsage,
          {
            detail:
              "Tokens are tracked, but provider cost is pending a pricing map.",
            label: "Unpriced runs",
            value: formatInteger(unpricedRunCount),
          },
        ]
      : baseUsage;

  return {
    planDescription: [
      `${formatUsdFromCents(billingAccount.monthlyPlatformFeeCents)} platform access fee`,
      `AI usage billed at provider cost + ${formatBasisPointsAsPercentage(billingAccount.profitPremiumBasisPoints)} premium`,
      `Period ${formatDate(billingPeriod.startAt)} to ${formatDate(billingPeriod.endAt)}`,
    ].join(" - "),
    planTitle: `${billingAccount.planName} plan`,
    usage,
  };
}

function getBillingPeriodWindow(
  nowIso: string,
  billingAnchorDayOfMonth: number,
): Readonly<{
  endAt: string;
  startAt: string;
}> {
  const nowDate = new Date(nowIso);
  const currentMonthAnchor = new Date(
    Date.UTC(
      nowDate.getUTCFullYear(),
      nowDate.getUTCMonth(),
      billingAnchorDayOfMonth,
      0,
      0,
      0,
      0,
    ),
  );
  const startAt =
    nowDate >= currentMonthAnchor
      ? currentMonthAnchor
      : new Date(
          Date.UTC(
            nowDate.getUTCFullYear(),
            nowDate.getUTCMonth() - 1,
            billingAnchorDayOfMonth,
            0,
            0,
            0,
            0,
          ),
        );
  const endAt = new Date(
    Date.UTC(
      startAt.getUTCFullYear(),
      startAt.getUTCMonth() + 1,
      billingAnchorDayOfMonth,
      0,
      0,
      0,
      0,
    ),
  );

  return {
    endAt: endAt.toISOString(),
    startAt: startAt.toISOString(),
  };
}

function centsToNanoUsd(cents: number): number {
  return cents * 10_000_000;
}

function formatBasisPointsAsPercentage(basisPoints: number): string {
  const percentage = basisPoints / 100;

  return percentage % 1 === 0
    ? `${percentage.toFixed(0)}%`
    : `${percentage.toFixed(2)}%`;
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
