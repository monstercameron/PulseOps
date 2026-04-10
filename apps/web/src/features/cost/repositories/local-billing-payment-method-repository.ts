import path from "node:path";

import {
  billingPaymentMethodSchema,
  type BillingPaymentMethod,
} from "@/features/cost/domain/billing-payment-method";
import { type BillingPaymentMethodRepository } from "@/features/cost/repositories/billing-payment-method-repository";
import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";

type LocalBillingPaymentMethodRepositoryOptions = Readonly<{
  rootDirectory: string;
}>;

export function createLocalBillingPaymentMethodRepository({
  rootDirectory,
}: LocalBillingPaymentMethodRepositoryOptions): BillingPaymentMethodRepository {
  const collection = createLocalJsonCollection({
    filePath: path.join(rootDirectory, "billing-payment-methods.json"),
    recordSchema: billingPaymentMethodSchema,
  });

  return {
    async deleteByOrgIdAndRole(orgId, role) {
      const billingPaymentMethods = await collection.list();
      const target = billingPaymentMethods.find(
        (billingPaymentMethod) =>
          billingPaymentMethod.orgId === orgId &&
          billingPaymentMethod.role === role,
      );

      if (target !== undefined) {
        await collection.deleteById(target.id);
      }
    },
    async getByOrgIdAndRole(orgId, role) {
      const billingPaymentMethods = await collection.list();

      return (
        billingPaymentMethods.find(
          (billingPaymentMethod) =>
            billingPaymentMethod.orgId === orgId &&
            billingPaymentMethod.role === role,
        ) ?? null
      );
    },
    async listByOrgId(orgId) {
      const billingPaymentMethods = await collection.list();

      return billingPaymentMethods.filter(
        (billingPaymentMethod) => billingPaymentMethod.orgId === orgId,
      );
    },
    async put(billingPaymentMethod) {
      return collection.put(
        billingPaymentMethodSchema.parse(billingPaymentMethod),
      );
    },
  };
}

export type { BillingPaymentMethod };
