import { z } from "zod";

import { type SettingsRecord } from "@/features/settings/domain/settings-record";

export const organizationStatusSchema = z.enum(["active", "inactive", "trial"]);

export const organizationRecordSchema = z.object({
  createdAt: z.string().datetime(),
  goals: z.array(z.string().min(1)).readonly(),
  id: z.string().min(1),
  industry: z.string().min(1),
  invoiceCycle: z.string().min(1),
  location: z.string().min(1),
  name: z.string().min(1),
  revenueModel: z.string().min(1),
  status: organizationStatusSchema,
  teamSize: z.string().min(1),
  updatedAt: z.string().datetime(),
  version: z.literal("organization-record.v1"),
});

export type OrganizationRecord = z.infer<typeof organizationRecordSchema>;

type CreateOrganizationRecordInput = Omit<
  OrganizationRecord,
  "createdAt" | "updatedAt" | "version"
> & {
  createdAt?: string;
  updatedAt?: string;
};

export function createOrganizationRecord(
  input: CreateOrganizationRecordInput,
): OrganizationRecord {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return organizationRecordSchema.parse({
    ...input,
    createdAt,
    updatedAt: input.updatedAt ?? createdAt,
    version: "organization-record.v1",
  });
}

export function createOrganizationRecordFromSettingsRecord(
  settingsRecord: SettingsRecord,
  input?: Readonly<{
    createdAt?: string;
    status?: z.infer<typeof organizationStatusSchema>;
    updatedAt?: string;
  }>,
): OrganizationRecord {
  return createOrganizationRecord({
    createdAt: input?.createdAt,
    goals: settingsRecord.organization.goals,
    id: settingsRecord.orgId,
    industry: settingsRecord.organization.industry,
    invoiceCycle: settingsRecord.organization.invoiceCycle,
    location: settingsRecord.organization.location,
    name: settingsRecord.organization.name,
    revenueModel: settingsRecord.organization.revenueModel,
    status: input?.status ?? "active",
    teamSize: settingsRecord.organization.teamSize,
    updatedAt: input?.updatedAt ?? settingsRecord.updatedAt,
  });
}
