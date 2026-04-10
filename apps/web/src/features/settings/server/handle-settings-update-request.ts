import { z } from "zod";

import { type AccountRepository } from "@/features/accounts/repositories/account-repository";
import { type CurrentAppActor } from "@/features/auth/server/current-app-actor";
import { createDefaultBillingAccount } from "@/features/cost/domain/billing-account";
import {
  billingPaymentMethodEntrySchema,
  createMaskedBillingPaymentMethod,
} from "@/features/cost/domain/billing-payment-method";
import { type BillingAccountRepository } from "@/features/cost/repositories/billing-account-repository";
import { type BillingPaymentMethodRepository } from "@/features/cost/repositories/billing-payment-method-repository";
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
  settingsWebsiteDetailsInputSchema,
  updateSettingsRecord,
} from "@/features/settings/server/settings-record-service";

const settingsBillingInputSchema = z.object({
  backupCard: billingPaymentMethodEntrySchema.nullable().optional(),
  primaryCard: billingPaymentMethodEntrySchema.nullable().optional(),
  usageCapCents: z.number().int().nonnegative().nullable().optional(),
});

const settingsUpdateRequestSchema = z.object({
  billing: settingsBillingInputSchema.optional(),
  notifications: settingsNotificationGroupsInputSchema.optional(),
  organization: settingsOrganizationInputSchema.optional(),
  orgId: z.string().min(1),
  preferences: settingsPreferenceItemsInputSchema.optional(),
  websiteDetails: settingsWebsiteDetailsInputSchema.optional(),
});

type SettingsUpdateDependencies = Readonly<{
  accountRepository?: AccountRepository;
  billingAccountRepository?: BillingAccountRepository;
  billingPaymentMethodRepository?: BillingPaymentMethodRepository;
  currentActor?: CurrentAppActor | null;
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
    parsedBody.data.billing !== undefined ||
    parsedBody.data.organization !== undefined ||
    parsedBody.data.notifications !== undefined ||
    parsedBody.data.preferences !== undefined ||
    parsedBody.data.websiteDetails !== undefined;

  if (!hasMutableSection) {
    return Response.json(
      {
        error: "At least one settings section must be provided.",
      },
      { status: 400 },
    );
  }

  if (
    parsedBody.data.billing?.usageCapCents !== undefined &&
    dependencies.billingAccountRepository === undefined
  ) {
    return Response.json(
      {
        error: "Billing settings are not available.",
      },
      { status: 503 },
    );
  }

  if (
    (
      parsedBody.data.billing?.primaryCard !== undefined ||
      parsedBody.data.billing?.backupCard !== undefined
    ) &&
    dependencies.billingPaymentMethodRepository === undefined
  ) {
    return Response.json(
      {
        error: "Billing payment methods are not available.",
      },
      { status: 503 },
    );
  }

  const nowIso = dependencies.now?.() ?? new Date().toISOString();
  const hasSettingsRecordSection =
    parsedBody.data.organization !== undefined ||
    parsedBody.data.notifications !== undefined ||
    parsedBody.data.preferences !== undefined ||
    parsedBody.data.websiteDetails !== undefined;
  const updatedSettingsRecord = hasSettingsRecordSection
    ? await updateSettingsRecord({
        now: () => nowIso,
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
          websiteDetails:
            parsedBody.data.websiteDetails ?? settingsRecord.websiteDetails,
        }),
      })
    : null;

  if (
    updatedSettingsRecord !== null &&
    dependencies.organizationRepository !== undefined
  ) {
    await dependencies.organizationRepository.put(
      createOrganizationRecordFromSettingsRecord(updatedSettingsRecord, {
        updatedAt: updatedSettingsRecord.updatedAt,
      }),
    );
  }

  if (parsedBody.data.billing !== undefined) {
    if (parsedBody.data.billing.usageCapCents !== undefined) {
      const currentBillingAccount =
        (await dependencies.billingAccountRepository!.getByOrgId(parsedBody.data.orgId)) ??
        createDefaultBillingAccount(parsedBody.data.orgId, nowIso);

      await dependencies.billingAccountRepository!.put({
        ...currentBillingAccount,
        updatedAt: nowIso,
        usageCapCents: parsedBody.data.billing.usageCapCents,
      });
    }

    if (parsedBody.data.billing.primaryCard !== undefined) {
      await upsertBillingPaymentMethod({
        billingPaymentMethodRepository: dependencies.billingPaymentMethodRepository!,
        entry: parsedBody.data.billing.primaryCard,
        nowIso,
        orgId: parsedBody.data.orgId,
        role: "primary",
      });
    }

    if (parsedBody.data.billing.backupCard !== undefined) {
      await upsertBillingPaymentMethod({
        billingPaymentMethodRepository: dependencies.billingPaymentMethodRepository!,
        entry: parsedBody.data.billing.backupCard,
        nowIso,
        orgId: parsedBody.data.orgId,
        role: "backup",
      });
    }
  }

  const billing = await getSettingsBillingData({
    billingAccountRepository: dependencies.billingAccountRepository,
    billingPaymentMethodRepository: dependencies.billingPaymentMethodRepository,
    llmUsageEventRepository: dependencies.llmUsageEventRepository,
    now: () => nowIso,
    orgId: parsedBody.data.orgId,
  });
  const data = await getSettingsPageDataFromRepository({
    accountRepository: dependencies.accountRepository,
    billing,
    currentActorUserId: dependencies.currentActor?.account.userId,
    currentActorWasFallback:
      dependencies.currentActor?.source === "fallback",
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

async function upsertBillingPaymentMethod(input: Readonly<{
  billingPaymentMethodRepository: BillingPaymentMethodRepository;
  entry: null | z.infer<typeof billingPaymentMethodEntrySchema>;
  nowIso: string;
  orgId: string;
  role: "backup" | "primary";
}>) {
  if (input.entry === null) {
    await input.billingPaymentMethodRepository.deleteByOrgIdAndRole(
      input.orgId,
      input.role,
    );

    return;
  }

  const existingPaymentMethod =
    await input.billingPaymentMethodRepository.getByOrgIdAndRole(
      input.orgId,
      input.role,
    );

  await input.billingPaymentMethodRepository.put(
    createMaskedBillingPaymentMethod({
      entry: input.entry,
      existingCreatedAt: existingPaymentMethod?.createdAt,
      now: input.nowIso,
      orgId: input.orgId,
      role: input.role,
    }),
  );
}
