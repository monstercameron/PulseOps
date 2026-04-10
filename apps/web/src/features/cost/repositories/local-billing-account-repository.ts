import path from "node:path";

import {
  billingAccountSchema,
  type BillingAccount,
} from "@/features/cost/domain/billing-account";
import { type BillingAccountRepository } from "@/features/cost/repositories/billing-account-repository";
import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";

type LocalBillingAccountRepositoryOptions = Readonly<{
  rootDirectory: string;
}>;

export function createLocalBillingAccountRepository({
  rootDirectory,
}: LocalBillingAccountRepositoryOptions): BillingAccountRepository {
  const collection = createLocalJsonCollection({
    filePath: path.join(rootDirectory, "billing-accounts.json"),
    recordSchema: billingAccountSchema,
  });

  return {
    async getByOrgId(orgId) {
      const billingAccounts = await collection.list();

      return billingAccounts.find((billingAccount) => billingAccount.orgId === orgId) ?? null;
    },
    async put(billingAccount) {
      return collection.put(billingAccountSchema.parse(billingAccount));
    },
  };
}

export type { BillingAccount };
