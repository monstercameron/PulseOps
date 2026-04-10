import path from "node:path";

import {
  organizationAccountRecordSchema,
  type OrganizationAccountRecord,
} from "@/features/accounts/domain/organization-account";
import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";
import { type AccountRepository } from "@/features/accounts/repositories/account-repository";

type CreateLocalAccountRepositoryInput = Readonly<{
  rootDirectory: string;
}>;

export function createLocalAccountRepository({
  rootDirectory,
}: CreateLocalAccountRepositoryInput): AccountRepository {
  const collection = createLocalJsonCollection({
    filePath: path.join(rootDirectory, "organization-accounts.json"),
    recordSchema: organizationAccountRecordSchema,
  });

  return {
    async getByOrgIdAndEmail(orgId, email) {
      const normalizedEmail = email.trim().toLowerCase();
      const organizationAccounts = await collection.list();

      return (
        organizationAccounts.find(
          (account) =>
            account.orgId === orgId &&
            account.email.trim().toLowerCase() === normalizedEmail,
        ) ?? null
      );
    },
    async getByOrgIdAndUserId(orgId, userId) {
      const organizationAccounts = await collection.list();

      return (
        organizationAccounts.find(
          (account) => account.orgId === orgId && account.userId === userId,
        ) ?? null
      );
    },
    async listByOrgId(orgId) {
      const organizationAccounts = await collection.list();

      return organizationAccounts.filter((account) => account.orgId === orgId);
    },
    async put(organizationAccount) {
      return collection.put(
        organizationAccountRecordSchema.parse(organizationAccount),
      );
    },
  };
}

export type { OrganizationAccountRecord };
