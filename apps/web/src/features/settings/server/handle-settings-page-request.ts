import { z } from "zod";

import { type CurrentAppActor } from "@/features/auth/server/current-app-actor";
import { type BillingAccountRepository } from "@/features/cost/repositories/billing-account-repository";
import { type BillingPaymentMethodRepository } from "@/features/cost/repositories/billing-payment-method-repository";
import { type LlmUsageEventRepository } from "@/features/cost/repositories/llm-usage-event-repository";
import { getSettingsBillingData } from "@/features/cost/server/settings-billing-data";
import { type SettingsPageData } from "@/features/settings/constants/settings-page-content";
import { getSettingsPageDataFromRepository } from "@/features/settings/server/settings-record-service";
import { type AccountRepository } from "@/features/accounts/repositories/account-repository";
import { type OrganizationRepository } from "@/features/settings/repositories/organization-repository";
import { type SettingsRepository } from "@/features/settings/repositories/settings-repository";

const settingsSearchParamsSchema = z.object({
  orgId: z.string().min(1),
});

type SettingsDependencies = Readonly<{
  accountRepository?: AccountRepository;
  billingAccountRepository?: BillingAccountRepository;
  billingPaymentMethodRepository?: BillingPaymentMethodRepository;
  currentActor?: CurrentAppActor | null;
  llmUsageEventRepository?: LlmUsageEventRepository;
  now?: () => string;
  organizationRepository?: OrganizationRepository;
  settingsRepository?: SettingsRepository;
}>;

export async function handleSettingsPageRequest(
  request: Request,
  dependencies?: SettingsDependencies,
) {
  const url = new URL(request.url);
  const parsedSearchParams = settingsSearchParamsSchema.safeParse({
    orgId: url.searchParams.get("orgId"),
  });

  if (!parsedSearchParams.success) {
    return Response.json(
      {
        error: "Missing orgId query parameter.",
      },
      { status: 400 },
    );
  }

  const data = await getSettingsPageData(
    parsedSearchParams.data.orgId,
    dependencies,
  );

  return Response.json({
    orgId: parsedSearchParams.data.orgId,
    ...data,
  });
}

export async function getSettingsPageData(
  orgId: string,
  dependencies?: SettingsDependencies,
): Promise<SettingsPageData> {
  const billing = await getSettingsBillingData({
    billingAccountRepository: dependencies?.billingAccountRepository,
    billingPaymentMethodRepository: dependencies?.billingPaymentMethodRepository,
    llmUsageEventRepository: dependencies?.llmUsageEventRepository,
    now: dependencies?.now,
    orgId,
  });

  return getSettingsPageDataFromRepository({
    accountRepository: dependencies?.accountRepository,
    billing,
    currentActorUserId: dependencies?.currentActor?.account.userId,
    currentActorWasFallback:
      dependencies?.currentActor?.source === "fallback",
    orgId,
    organizationRepository: dependencies?.organizationRepository,
    settingsRepository: dependencies?.settingsRepository,
  });
}
