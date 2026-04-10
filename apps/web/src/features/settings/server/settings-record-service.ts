import { randomUUID } from "node:crypto";

import { z } from "zod";

import {
  canEditAccountIdentity,
  canInviteTeamMembers,
  canManageAccountAuthorization,
  canOpenAccountControls,
  canResetAccountPassword,
} from "@/features/accounts/domain/account-authorization";
import {
  getOrganizationAccountAccessSummary,
  getOrganizationAccountRoleLabel,
  getOrganizationAccountStatusLabel,
  organizationAccountRoleSchema,
  type OrganizationAccountRecord,
} from "@/features/accounts/domain/organization-account";
import { type AccountRepository } from "@/features/accounts/repositories/account-repository";
import { websiteDetailsSchema } from "@/features/marketing/domain/website-details";
import {
  createDefaultSettingsRecord,
  createSettingsRecord,
  type SettingsRecord,
} from "@/features/settings/domain/settings-record";
import {
  settingsDataPolicySchema,
  settingsDeliverySettingsSchema,
  settingsImportRuleSchema,
} from "@/features/settings/domain/settings-operational-config";
import { type OrganizationRecord } from "@/features/settings/domain/organization-record";
import {
  buildVisibleSettingsTabs,
  buildSettingsAccess,
} from "@/features/settings/lib/settings-access";
import { getSettingsSecurityAuthRowKind } from "@/features/settings/lib/settings-security";
import {
  fallbackSettingsPageData,
  type SettingsPageData,
} from "@/features/settings/constants/settings-page-content";
import { normalizeSettingsPreferenceId } from "@/features/settings/domain/settings-preferences";
import { type OrganizationRepository } from "@/features/settings/repositories/organization-repository";
import { type SettingsRepository } from "@/features/settings/repositories/settings-repository";

export const settingsOrganizationInputSchema = z.object({
  goals: z.array(z.string().min(1)).readonly().optional(),
  industry: z.string().min(1),
  invoiceCycle: z.string().min(1),
  location: z.string().min(1),
  name: z.string().min(1),
  revenueModel: z.string().min(1),
  teamSize: z.string().min(1),
});

export const settingsNotificationGroupsInputSchema = z.array(
  z.object({
    id: z.string().min(1),
    items: z.array(
      z.object({
        description: z.string().min(1),
        enabled: z.boolean(),
        title: z.string().min(1),
      }),
    ).readonly(),
    title: z.string().min(1),
  }),
).readonly();

export const settingsPreferenceItemsInputSchema = z.array(
  z
    .object({
      description: z.string().min(1),
      enabled: z.boolean(),
      id: z.string().min(1).optional(),
      title: z.string().min(1),
    })
    .transform((preference) => ({
      ...preference,
      id: normalizeSettingsPreferenceId(preference),
    })),
).readonly();

export const settingsWebsiteDetailsInputSchema = websiteDetailsSchema;
export const settingsDeliverySettingsInputSchema = settingsDeliverySettingsSchema;
export const settingsDataPolicyInputSchema = settingsDataPolicySchema;
export const settingsImportRulesInputSchema = z
  .array(settingsImportRuleSchema)
  .readonly();

export const settingsInviteInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: organizationAccountRoleSchema,
});

export async function getSettingsRecord(
  settingsRepository: SettingsRepository | undefined,
  orgId: string,
): Promise<SettingsRecord> {
  const persistedSettings = await settingsRepository?.getByOrgId(orgId);

  if (persistedSettings !== null && persistedSettings !== undefined) {
    return createSettingsRecord(persistedSettings);
  }

  return createDefaultSettingsRecord(orgId);
}

export async function getSettingsPageDataFromRepository(input: Readonly<{
  accountRepository?: AccountRepository;
  billing?: SettingsPageData["billing"];
  currentActorUserId?: string;
  currentActorWasFallback?: boolean;
  orgId: string;
  organizationRepository?: OrganizationRepository;
  settingsRepository?: SettingsRepository;
}>): Promise<SettingsPageData> {
  const settingsRecord = await getSettingsRecord(input.settingsRepository, input.orgId);
  const organizationRecord = await input.organizationRepository?.getById(input.orgId);
  const persistedAccounts = await input.accountRepository?.listByOrgId(input.orgId);
  const currentAccount =
    persistedAccounts?.find((account) => account.userId === input.currentActorUserId) ??
    persistedAccounts?.find(
      (account) => account.status === "active" && account.role === "admin",
    ) ??
    persistedAccounts?.find((account) => account.status === "active");
  const teamMembers =
    persistedAccounts !== undefined && persistedAccounts.length > 0
        ? persistedAccounts
          .slice()
          .sort(compareOrganizationAccounts)
          .map((account) =>
            mapOrganizationAccountToSettingsMember(account, currentAccount),
          )
      : settingsRecord.teamMembers.map((member) => ({
          ...member,
          accessSummary: getLegacyTeamMemberAccessSummary(member.role),
          canEditAuthorization: false,
          canEditIdentity: true,
          canOpenAccountControls: true,
          canResetPassword: true,
          id: member.email,
          isCurrentUser:
            member.email.toLowerCase() ===
            (
              fallbackSettingsPageData.currentUser.email
            ).toLowerCase(),
          userId: member.email,
          operationsAccess: member.role.toLowerCase() === "admin" || member.role.toLowerCase() === "operator",
          reportAccess: member.role.toLowerCase() !== "operator",
          setupAccess: member.role.toLowerCase() === "admin" || member.role.toLowerCase() === "operator",
        }));
  const currentUser =
    currentAccount === undefined || currentAccount === null
      ? fallbackSettingsPageData.currentUser
      : {
          ...buildSettingsAccess(currentAccount),
          accessSummary: getOrganizationAccountAccessSummary(currentAccount),
          canInviteMembers: canInviteTeamMembers(currentAccount),
          canManageAccounts: currentAccount.role === "admin",
          email: currentAccount.email,
          isFallbackSession: input.currentActorWasFallback ?? false,
          name: currentAccount.name,
          operationsAccess: currentAccount.operationsAccess,
          reportAccess: currentAccount.reportAccess,
          role: getOrganizationAccountRoleLabel(currentAccount.role),
          setupAccess: currentAccount.setupAccess,
          userId: currentAccount.userId,
        };
  const primaryEmail =
    currentUser.email ??
    fallbackSettingsPageData.security.authRows[0]?.description ??
    "No primary email configured";

  return applySettingsPageAccess({
    ...fallbackSettingsPageData,
    billing: input.billing ?? fallbackSettingsPageData.billing,
    currentUser,
    dataPolicy: settingsRecord.dataPolicy,
    deliverySettings: settingsRecord.deliverySettings,
    integrations: settingsRecord.integrations,
    importRules: settingsRecord.importRules,
    notifications: settingsRecord.notifications,
    organization:
      organizationRecord === undefined || organizationRecord === null
        ? settingsRecord.organization
        : mapOrganizationRecordToSettingsOrganization(organizationRecord),
    preferences: settingsRecord.preferences,
    security: {
      ...fallbackSettingsPageData.security,
      authRows: fallbackSettingsPageData.security.authRows.map((row, index) =>
        index === 0 ? { ...row, description: primaryEmail } : row,
      ),
      apiKeys: settingsRecord.securityApiKeys,
      sessions: settingsRecord.securitySessions,
    },
    team: {
      ...fallbackSettingsPageData.team,
      members: teamMembers,
    },
    tabs: buildVisibleSettingsTabs(currentUser),
    websiteDetails: settingsRecord.websiteDetails,
  });
}

export async function updateSettingsRecord(
  input: Readonly<{
    now?: () => string;
    orgId: string;
    settingsRepository: SettingsRepository;
    updater: (settingsRecord: SettingsRecord) => SettingsRecord;
  }>,
): Promise<SettingsRecord> {
  const currentSettings = await getSettingsRecord(input.settingsRepository, input.orgId);
  const updatedSettings = input.updater(currentSettings);

  return input.settingsRepository.put(
    createSettingsRecord({
      ...updatedSettings,
      updatedAt: input.now?.() ?? new Date().toISOString(),
    }),
  );
}

export function upsertInvitedTeamMember(
  settingsRecord: SettingsRecord,
  invite: z.infer<typeof settingsInviteInputSchema>,
): SettingsRecord {
  const existingMembers = settingsRecord.teamMembers.filter(
    (member) => member.email !== invite.email,
  );

  return createSettingsRecord({
    ...settingsRecord,
    teamMembers: [
      {
        email: invite.email,
        name: invite.name,
        role: getOrganizationAccountRoleLabel(invite.role),
        status: "invited",
        statusLabel: "Invited",
      },
      ...existingMembers,
    ],
  });
}

export function revokeApiKey(
  settingsRecord: SettingsRecord,
  apiKeyName: string,
): SettingsRecord {
  return createSettingsRecord({
    ...settingsRecord,
    securityApiKeys: settingsRecord.securityApiKeys.filter(
      (apiKey) => apiKey.name !== apiKeyName,
    ),
  });
}

export function revokeSession(
  settingsRecord: SettingsRecord,
  sessionTitle: string,
): SettingsRecord {
  return createSettingsRecord({
    ...settingsRecord,
    securitySessions: settingsRecord.securitySessions.filter(
      (session) => session.title !== sessionTitle || session.isCurrent === true,
    ),
  });
}

export function createGeneratedApiKeyName(prefix = "Workspace key") {
  return `${prefix} ${randomUUID().slice(0, 8)}`;
}

function compareOrganizationAccounts(
  left: OrganizationAccountRecord,
  right: OrganizationAccountRecord,
) {
  return (
    getOrganizationAccountSortRank(left) - getOrganizationAccountSortRank(right) ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.email.localeCompare(right.email)
  );
}

function getOrganizationAccountSortRank(account: OrganizationAccountRecord) {
  const statusRank =
    account.status === "active"
      ? 0
      : account.status === "invited"
        ? 1
        : 2;
  const roleRank =
    account.role === "admin"
      ? 0
      : account.role === "operator"
        ? 1
        : account.role === "analyst"
          ? 2
          : 3;

  return statusRank * 10 + roleRank;
}

function mapOrganizationAccountToSettingsMember(
  account: OrganizationAccountRecord,
  currentAccount: OrganizationAccountRecord | undefined,
): SettingsPageData["team"]["members"][number] {
  const isCurrentUser = currentAccount?.userId === account.userId;

  return {
    accessSummary: getOrganizationAccountAccessSummary(account),
    canEditAuthorization:
      currentAccount === undefined
        ? false
        : canManageAccountAuthorization(currentAccount, account),
    canEditIdentity:
      currentAccount === undefined
        ? false
        : canEditAccountIdentity(currentAccount, account),
    canOpenAccountControls:
      currentAccount === undefined
        ? false
        : canOpenAccountControls(currentAccount, account),
    canResetPassword:
      currentAccount === undefined
        ? false
        : canResetAccountPassword(currentAccount, account),
    email: account.email,
    id: account.id,
    isCurrentUser,
    name: account.name,
    operationsAccess: account.operationsAccess,
    reportAccess: account.reportAccess,
    role: getOrganizationAccountRoleLabel(account.role),
    setupAccess: account.setupAccess,
    status: account.status === "disabled" ? "invited" : account.status,
    statusLabel: getOrganizationAccountStatusLabel(account.status),
    userId: account.userId,
  };
}

function applySettingsPageAccess(pageData: SettingsPageData): SettingsPageData {
  return {
    ...pageData,
    billing: pageData.currentUser.canManageBilling
      ? pageData.billing
      : createRestrictedBillingData(),
    dataPolicy: pageData.currentUser.canManageWorkspaceSettings
      ? pageData.dataPolicy
      : createRestrictedDataPolicy(),
    deliverySettings: pageData.currentUser.canManageOperationalSettings
      ? pageData.deliverySettings
      : createRestrictedDeliverySettings(),
    integrations: pageData.currentUser.canManageOperationalSettings
      ? pageData.integrations
      : [],
    importRules: pageData.currentUser.canManageWorkspaceSettings
      ? pageData.importRules
      : [],
    notifications: pageData.currentUser.canManageOperationalSettings
      ? pageData.notifications
      : [],
    organization: pageData.currentUser.canManageWorkspaceSettings
      ? pageData.organization
      : createRestrictedOrganizationData(),
    preferences: pageData.currentUser.canManageWorkspaceSettings
      ? pageData.preferences
      : [],
    security: {
      authRows: pageData.security.authRows.filter((row) =>
        pageData.currentUser.canManageAccounts
          ? true
          : getSettingsSecurityAuthRowKind(row.title) !== "singleSignOn",
      ),
      apiKeys: pageData.currentUser.canManageAccounts
        ? pageData.security.apiKeys
        : [],
      sessions: pageData.currentUser.canManageAccounts
        ? pageData.security.sessions
        : [],
    },
    team: {
      members: pageData.currentUser.canManageAccounts
        ? pageData.team.members
        : pageData.team.members.filter((member) => member.isCurrentUser),
      permissions: pageData.currentUser.canManageAccounts
        ? pageData.team.permissions
        : [],
    },
    websiteDetails: pageData.currentUser.canManageWorkspaceSettings
      ? pageData.websiteDetails
      : createRestrictedWebsiteDetails(),
  };
}

function createRestrictedDataPolicy(): SettingsPageData["dataPolicy"] {
  return {
    embeddingsEnabled: false,
    extractionEnabled: false,
    humanReviewRequired: false,
    reviewThresholds: {
      acceptanceRateDriftThreshold: 0,
      briefHighConfidenceFloor: 0,
      classificationConfidenceFloor: 0,
      fieldConfidenceFloor: 0,
      outcomeRateDriftThreshold: 0,
      parserConfidenceFloor: 0,
    },
    sourceRetentionDays: {
      api: 0,
      email: 0,
      upload: 0,
    },
  };
}

function createRestrictedDeliverySettings(): SettingsPageData["deliverySettings"] {
  return {
    confidenceDropAlert: {
      enabled: false,
      recipientEmails: [],
      threshold: 0,
    },
    parseFailureAlert: {
      enabled: false,
      failureCountThreshold: 0,
      recipientEmails: [],
    },
    queueDigest: {
      enabled: false,
      recipientEmails: [],
      sendTimeLocal: "00:00",
    },
    sourceDisconnectedAlert: {
      enabled: false,
      recipientEmails: [],
    },
    weeklyBrief: {
      enabled: false,
      recipientEmails: [],
      sendDay: "monday",
      sendTimeLocal: "00:00",
    },
  };
}

function createRestrictedBillingData(): SettingsPageData["billing"] {
  return {
    graphMetrics: {
      currentTotalCents: 0,
      flatFeeCents: 0,
      usageThisPeriodCents: 0,
    },
    paymentMethods: [],
    planDescription: "Billing details are restricted for this account.",
    planTitle: "Restricted",
    usage: [
      {
        detail: "Not available for this account.",
        id: "flat_fee",
        label: "Platform access",
        value: "--",
      },
      {
        detail: "Not available for this account.",
        id: "usage_this_period",
        label: "Usage this period",
        value: "--",
      },
      {
        detail: "Not available for this account.",
        id: "current_total",
        label: "Current total",
        value: "--",
      },
    ],
    usageCapCents: null,
  };
}

function createRestrictedOrganizationData(): SettingsPageData["organization"] {
  return {
    goals: [],
    industry: "",
    invoiceCycle: "",
    location: "",
    name: "",
    revenueModel: "",
    teamSize: "",
  };
}

function createRestrictedWebsiteDetails(): SettingsPageData["websiteDetails"] {
  return {
    mainPhone: "",
    partnershipsEmail: "",
    pressEmail: "",
    salesEmail: "",
    supportEmail: "",
    supportPhone: "",
  };
}

function mapOrganizationRecordToSettingsOrganization(
  organizationRecord: OrganizationRecord,
): SettingsPageData["organization"] {
  return {
    goals: organizationRecord.goals,
    industry: organizationRecord.industry,
    invoiceCycle: organizationRecord.invoiceCycle,
    location: organizationRecord.location,
    name: organizationRecord.name,
    revenueModel: organizationRecord.revenueModel,
    teamSize: organizationRecord.teamSize,
  };
}

function getLegacyTeamMemberAccessSummary(role: string) {
  switch (role.toLowerCase()) {
    case "admin":
      return "Setup, Ops, Reports";
    case "operator":
      return "Setup, Ops";
    case "analyst":
      return "Reports";
    case "viewer":
      return "Reports";
    default:
      return "Access pending";
  }
}

export function connectIntegration(
  settingsRecord: SettingsRecord,
  integrationTitle: string,
): SettingsRecord {
  return createSettingsRecord({
    ...settingsRecord,
    integrations: settingsRecord.integrations.map((integration) =>
      integration.title !== integrationTitle
        ? integration
        : {
            ...integration,
            actionLabel: "Disconnect",
            secondaryActionLabel: "Sync now",
            statusLabel: "Connected",
            statusTone: "success" as const,
          },
    ),
  });
}

export function disconnectIntegration(
  settingsRecord: SettingsRecord,
  integrationTitle: string,
): SettingsRecord {
  return createSettingsRecord({
    ...settingsRecord,
    integrations: settingsRecord.integrations.map((integration) =>
      integration.title !== integrationTitle
        ? integration
        : {
            ...integration,
            actionLabel: "Connect",
            secondaryActionLabel: undefined,
            statusLabel: "Available",
            statusTone: "neutral" as const,
          },
    ),
  });
}
