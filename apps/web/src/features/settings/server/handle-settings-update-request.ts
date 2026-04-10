import { z } from "zod";

import { type AccountRepository } from "@/features/accounts/repositories/account-repository";
import { type BillingAccountRepository } from "@/features/cost/repositories/billing-account-repository";
import { type LlmUsageEventRepository } from "@/features/cost/repositories/llm-usage-event-repository";
import { getSettingsBillingData } from "@/features/cost/server/settings-billing-data";
import { createOrganizationRecordFromSettingsRecord } from "@/features/settings/domain/organization-record";
import { type OrganizationRepository } from "@/features/settings/repositories/organization-repository";
import { type SettingsRepository } from "@/features/settings/repositories/settings-repository";
import {
  getSettingsPageDataFromRepository,
  settingsNotificationGroupsInputSchema,
  settingsOrganizationInputSchema,
  settingsPreferenceItemsInputSchema,
  updateSettingsRecord,
} from "@/features/settings/server/settings-record-service";

const settingsUpdateRequestSchema = z.object({
  notifications: settingsNotificationGroupsInputSchema.optional(),
  organization: settingsOrganizationInputSchema.optional(),
  orgId: z.string().min(1),
  preferences: settingsPreferenceItemsInputSchema.optional(),
});

type SettingsUpdateDependencies = Readonly<{
  accountRepository?: AccountRepository;
  billingAccountRepository?: BillingAccountRepository;
  llmUsageEventRepository?: LlmUsageEventRepository;
  now?: () => string;
  organizationRepository?: OrganizationRepository;
  settingsRepository: SettingsRepository;
}>;

export async function handleSettingsUpdateRequest(
  request: Request,
  dependencies: SettingsUpdateDependencies,
) {
  const parsedBody = settingsUpdateRequestSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return Response.json(
      {
        error: "Invalid settings update payload.",
      },
      { status: 400 },
    );
  }

  const hasMutableSection =
    parsedBody.data.organization !== undefined ||
    parsedBody.data.notifications !== undefined ||
    parsedBody.data.preferences !== undefined;

  if (!hasMutableSection) {
    return Response.json(
      {
        error: "At least one settings section must be provided.",
      },
      { status: 400 },
    );
  }

  const updatedSettingsRecord = await updateSettingsRecord({
    now: dependencies.now,
    orgId: parsedBody.data.orgId,
    settingsRepository: dependencies.settingsRepository,
    updater: (settingsRecord) => ({
      ...settingsRecord,
      notifications: parsedBody.data.notifications ?? settingsRecord.notifications,
      organization: parsedBody.data.organization
        ? {
            ...settingsRecord.organization,
            ...parsedBody.data.organization,
            goals:
              parsedBody.data.organization.goals ?? settingsRecord.organization.goals,
          }
        : settingsRecord.organization,
      preferences: parsedBody.data.preferences ?? settingsRecord.preferences,
    }),
  });

  if (dependencies.organizationRepository !== undefined) {
    await dependencies.organizationRepository.put(
      createOrganizationRecordFromSettingsRecord(updatedSettingsRecord, {
        updatedAt: updatedSettingsRecord.updatedAt,
      }),
    );
  }

  const billing = await getSettingsBillingData({
    billingAccountRepository: dependencies.billingAccountRepository,
    llmUsageEventRepository: dependencies.llmUsageEventRepository,
    now: dependencies.now,
    orgId: parsedBody.data.orgId,
  });
  const data = await getSettingsPageDataFromRepository({
    accountRepository: dependencies.accountRepository,
    billing,
    orgId: parsedBody.data.orgId,
    organizationRepository: dependencies.organizationRepository,
    settingsRepository: dependencies.settingsRepository,
  });

  return Response.json(
    {
      orgId: parsedBody.data.orgId,
      ...data,
    },
    { status: 200 },
  );
}
