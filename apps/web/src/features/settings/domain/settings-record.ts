import { z } from "zod";

import { websiteDetailsSchema } from "@/features/marketing/domain/website-details";
import { fallbackSettingsPageData } from "@/features/settings/constants/settings-page-content";
import {
  defaultSettingsDataPolicy,
  defaultSettingsDeliverySettings,
  defaultSettingsImportRules,
  settingsDataPolicySchema,
  settingsDeliverySettingsSchema,
  settingsImportRuleSchema,
} from "@/features/settings/domain/settings-operational-config";
import {
  mergeSettingsPreferencesWithDefaults,
  normalizeSettingsPreferenceId,
} from "@/features/settings/domain/settings-preferences";

const settingsOrganizationSchema = z.object({
  goals: z.array(z.string().min(1)).readonly(),
  industry: z.string().min(1),
  invoiceCycle: z.string().min(1),
  location: z.string().min(1),
  name: z.string().min(1),
  revenueModel: z.string().min(1),
  teamSize: z.string().min(1),
});

const settingsNotificationGroupSchema = z.object({
  id: z.string().min(1),
  items: z.array(
    z.object({
      description: z.string().min(1),
      enabled: z.boolean(),
      title: z.string().min(1),
    }),
  ).readonly(),
  title: z.string().min(1),
});

const settingsPreferenceSchema = z
  .object({
    description: z.string().min(1),
    enabled: z.boolean(),
    id: z.string().min(1).optional(),
    title: z.string().min(1),
  })
  .transform((preference) => ({
    ...preference,
    id: normalizeSettingsPreferenceId(preference),
  }));

const settingsIntegrationSchema = z.object({
  actionLabel: z.string().min(1),
  description: z.string().min(1),
  secondaryActionLabel: z.string().min(1).optional(),
  statusLabel: z.string().min(1),
  statusTone: z.enum(["danger", "neutral", "success", "warning"]),
  title: z.string().min(1),
});

const settingsTeamMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.string().min(1),
  status: z.enum(["active", "invited"]),
  statusLabel: z.string().min(1),
});

const settingsApiKeySchema = z.object({
  createdLabel: z.string().min(1),
  keyLabel: z.string().min(1),
  name: z.string().min(1),
});

const settingsSessionSchema = z.object({
  actionLabel: z.string().min(1).optional(),
  detail: z.string().min(1),
  isCurrent: z.boolean().optional(),
  title: z.string().min(1),
});

export const settingsRecordSchema = z.object({
  dataPolicy: settingsDataPolicySchema.default(defaultSettingsDataPolicy),
  deliverySettings: settingsDeliverySettingsSchema.default(
    defaultSettingsDeliverySettings,
  ),
  id: z.string().min(1),
  integrations: z.array(settingsIntegrationSchema).readonly(),
  importRules: z.array(settingsImportRuleSchema).readonly().default(defaultSettingsImportRules),
  notifications: z.array(settingsNotificationGroupSchema).readonly(),
  organization: settingsOrganizationSchema,
  orgId: z.string().min(1),
  preferences: z.array(settingsPreferenceSchema).readonly(),
  securityApiKeys: z.array(settingsApiKeySchema).readonly(),
  securitySessions: z.array(settingsSessionSchema).readonly(),
  teamMembers: z.array(settingsTeamMemberSchema).readonly(),
  updatedAt: z.string().datetime(),
  version: z.literal("settings-record.v1"),
  websiteDetails: websiteDetailsSchema.default(fallbackSettingsPageData.websiteDetails),
});

export type SettingsRecord = z.infer<typeof settingsRecordSchema>;

type CreateSettingsRecordInput = Omit<SettingsRecord, "updatedAt" | "version"> & {
  updatedAt?: string;
};

export function createSettingsRecord(input: CreateSettingsRecordInput): SettingsRecord {
  return settingsRecordSchema.parse({
    ...input,
    preferences: mergeSettingsPreferencesWithDefaults(input.preferences),
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    version: "settings-record.v1",
  });
}

export function createDefaultSettingsRecord(
  orgId: string,
  updatedAt?: string,
): SettingsRecord {
  return createSettingsRecord({
    dataPolicy: fallbackSettingsPageData.dataPolicy,
    deliverySettings: fallbackSettingsPageData.deliverySettings,
    id: orgId,
    integrations: fallbackSettingsPageData.integrations,
    importRules: fallbackSettingsPageData.importRules,
    notifications: fallbackSettingsPageData.notifications,
    organization: fallbackSettingsPageData.organization,
    orgId,
    preferences: fallbackSettingsPageData.preferences,
    securityApiKeys: fallbackSettingsPageData.security.apiKeys,
    securitySessions: fallbackSettingsPageData.security.sessions,
    teamMembers: fallbackSettingsPageData.team.members,
    updatedAt,
    websiteDetails: fallbackSettingsPageData.websiteDetails,
  });
}
