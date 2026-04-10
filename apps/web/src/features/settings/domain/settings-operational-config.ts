import { z } from "zod";

import { supportedDocumentFamilyIdSchema } from "@/features/foundation/domain/document-families";
import {
  importBlueprintSourceKindSchema,
  importBlueprintStatusSchema,
} from "@/features/ingestion/domain/import-blueprint";
import { processingPolicyParserRouteSchema } from "@/features/governance/domain/processing-policy";

export const settingsDeliveryDaySchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
]);

export const settingsRecipientEmailListSchema = z.array(z.string().email()).readonly();

export const settingsScheduledNotificationSchema = z.object({
  enabled: z.boolean(),
  recipientEmails: settingsRecipientEmailListSchema,
  sendTimeLocal: z
    .string()
    .regex(/^\d{2}:\d{2}$/),
});

export const settingsDeliverySettingsSchema = z.object({
  confidenceDropAlert: z.object({
    enabled: z.boolean(),
    recipientEmails: settingsRecipientEmailListSchema,
    threshold: z.number().finite().min(0).max(1),
  }),
  parseFailureAlert: z.object({
    enabled: z.boolean(),
    failureCountThreshold: z.number().int().positive(),
    recipientEmails: settingsRecipientEmailListSchema,
  }),
  queueDigest: settingsScheduledNotificationSchema,
  sourceDisconnectedAlert: z.object({
    enabled: z.boolean(),
    recipientEmails: settingsRecipientEmailListSchema,
  }),
  weeklyBrief: settingsScheduledNotificationSchema.extend({
    sendDay: settingsDeliveryDaySchema,
  }),
});

export type SettingsDeliverySettings = z.infer<
  typeof settingsDeliverySettingsSchema
>;

export const settingsDataPolicySchema = z.object({
  embeddingsEnabled: z.boolean(),
  extractionEnabled: z.boolean(),
  humanReviewRequired: z.boolean(),
  reviewThresholds: z.object({
    acceptanceRateDriftThreshold: z.number().finite().min(0).max(1),
    briefHighConfidenceFloor: z.number().finite().min(0).max(1),
    classificationConfidenceFloor: z.number().finite().min(0).max(1),
    fieldConfidenceFloor: z.number().finite().min(0).max(1),
    outcomeRateDriftThreshold: z.number().finite().min(0).max(1),
    parserConfidenceFloor: z.number().finite().min(0).max(1),
  }),
  sourceRetentionDays: z.object({
    api: z.number().int().positive(),
    email: z.number().int().positive(),
    upload: z.number().int().positive(),
  }),
});

export type SettingsDataPolicy = z.infer<typeof settingsDataPolicySchema>;

export const settingsImportRuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  parserRoute: processingPolicyParserRouteSchema,
  sourceKind: importBlueprintSourceKindSchema,
  status: importBlueprintStatusSchema,
  targetDocumentFamily: supportedDocumentFamilyIdSchema,
});

export type SettingsImportRule = z.infer<typeof settingsImportRuleSchema>;

export const defaultSettingsDeliverySettings: SettingsDeliverySettings =
  settingsDeliverySettingsSchema.parse({
    confidenceDropAlert: {
      enabled: false,
      recipientEmails: ["jamie@browardhvac.com"],
      threshold: 0.8,
    },
    parseFailureAlert: {
      enabled: true,
      failureCountThreshold: 2,
      recipientEmails: ["jamie@browardhvac.com"],
    },
    queueDigest: {
      enabled: false,
      recipientEmails: ["jamie@browardhvac.com"],
      sendTimeLocal: "08:00",
    },
    sourceDisconnectedAlert: {
      enabled: true,
      recipientEmails: ["jamie@browardhvac.com"],
    },
    weeklyBrief: {
      enabled: true,
      recipientEmails: ["jamie@browardhvac.com"],
      sendDay: "monday",
      sendTimeLocal: "07:00",
    },
  });

export const defaultSettingsDataPolicy: SettingsDataPolicy =
  settingsDataPolicySchema.parse({
    embeddingsEnabled: true,
    extractionEnabled: true,
    humanReviewRequired: false,
    reviewThresholds: {
      acceptanceRateDriftThreshold: 0.2,
      briefHighConfidenceFloor: 0.85,
      classificationConfidenceFloor: 0.75,
      fieldConfidenceFloor: 0.7,
      outcomeRateDriftThreshold: 0.25,
      parserConfidenceFloor: 0.75,
    },
    sourceRetentionDays: {
      api: 90,
      email: 45,
      upload: 30,
    },
  });

export const defaultSettingsImportRules = [
  {
    id: "rule_upload_job_cost",
    name: "Manual upload -> job cost report",
    parserRoute: "tabular",
    sourceKind: "upload",
    status: "active",
    targetDocumentFamily: "job-cost-report",
  },
  {
    id: "rule_email_vendor_bill",
    name: "AP inbox -> vendor bill",
    parserRoute: "text",
    sourceKind: "email",
    status: "active",
    targetDocumentFamily: "vendor-bill",
  },
  {
    id: "rule_api_customer_invoice",
    name: "Service system export -> customer invoice",
    parserRoute: "tabular",
    sourceKind: "api",
    status: "active",
    targetDocumentFamily: "customer-invoice",
  },
] as const satisfies readonly SettingsImportRule[];
