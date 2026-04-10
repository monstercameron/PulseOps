import { randomUUID } from "node:crypto";

import { z } from "zod";

export const organizationAccountRoleSchema = z.enum([
  "admin",
  "operator",
  "analyst",
  "viewer",
]);

export const organizationAccountStatusSchema = z.enum([
  "active",
  "invited",
  "disabled",
]);

export const organizationAccountRecordSchema = z
  .object({
    createdAt: z.string().datetime(),
    email: z.string().email(),
    id: z.string().min(1),
    name: z.string().min(1),
    operationsAccess: z.boolean(),
    orgId: z.string().min(1),
    passwordHash: z.string().min(1).optional(),
    reportAccess: z.boolean(),
    role: organizationAccountRoleSchema,
    setupAccess: z.boolean(),
    status: organizationAccountStatusSchema,
    updatedAt: z.string().datetime(),
    userId: z.string().min(1),
    version: z.literal("organization-account.v1"),
  })
  .refine(
    (record) => record.setupAccess || record.operationsAccess || record.reportAccess,
    {
      message: "At least one access path must be enabled.",
      path: ["role"],
    },
  );

export type OrganizationAccountRecord = z.infer<
  typeof organizationAccountRecordSchema
>;

export type OrganizationAccountRole = z.infer<
  typeof organizationAccountRoleSchema
>;

export function createOrganizationAccount(
  input: Omit<
    OrganizationAccountRecord,
    | "createdAt"
    | "id"
    | "operationsAccess"
    | "reportAccess"
    | "setupAccess"
    | "updatedAt"
    | "userId"
    | "version"
  > &
    Partial<
      Pick<
        OrganizationAccountRecord,
        | "createdAt"
        | "id"
        | "operationsAccess"
        | "reportAccess"
        | "setupAccess"
        | "updatedAt"
        | "userId"
      >
    >,
): OrganizationAccountRecord {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const access = getDefaultOrganizationAccountAccess(input.role);

  return organizationAccountRecordSchema.parse({
    ...input,
    createdAt,
    id: input.id ?? `member_${randomUUID()}`,
    operationsAccess: input.operationsAccess ?? access.operationsAccess,
    reportAccess: input.reportAccess ?? access.reportAccess,
    setupAccess: input.setupAccess ?? access.setupAccess,
    updatedAt: input.updatedAt ?? createdAt,
    userId: input.userId ?? `user_${randomUUID()}`,
    version: "organization-account.v1",
  });
}

export function getDefaultOrganizationAccountAccess(role: OrganizationAccountRole) {
  switch (role) {
    case "admin":
      return {
        operationsAccess: true,
        reportAccess: true,
        setupAccess: true,
      };
    case "operator":
      return {
        operationsAccess: true,
        reportAccess: false,
        setupAccess: true,
      };
    case "analyst":
      return {
        operationsAccess: false,
        reportAccess: true,
        setupAccess: false,
      };
    case "viewer":
      return {
        operationsAccess: false,
        reportAccess: true,
        setupAccess: false,
      };
  }
}

export function getOrganizationAccountRoleLabel(role: OrganizationAccountRole) {
  switch (role) {
    case "admin":
      return "Admin";
    case "operator":
      return "Operator";
    case "analyst":
      return "Analyst";
    case "viewer":
      return "Viewer";
  }
}

export function getOrganizationAccountStatusLabel(
  status: OrganizationAccountRecord["status"],
) {
  switch (status) {
    case "active":
      return "Active";
    case "invited":
      return "Invited";
    case "disabled":
      return "Disabled";
  }
}

export function getOrganizationAccountAccessSummary(
  account: Pick<
    OrganizationAccountRecord,
    "operationsAccess" | "reportAccess" | "setupAccess"
  >,
) {
  const labels: string[] = [];

  if (account.setupAccess) {
    labels.push("Setup");
  }

  if (account.operationsAccess) {
    labels.push("Ops");
  }

  if (account.reportAccess) {
    labels.push("Reports");
  }

  return labels.join(", ");
}
