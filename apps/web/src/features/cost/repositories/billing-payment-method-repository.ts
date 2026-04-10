import {
  type BillingPaymentMethod,
  type BillingPaymentMethodRole,
} from "@/features/cost/domain/billing-payment-method";

export interface BillingPaymentMethodRepository {
  deleteByOrgIdAndRole(
    orgId: string,
    role: BillingPaymentMethodRole,
  ): Promise<void>;
  getByOrgIdAndRole(
    orgId: string,
    role: BillingPaymentMethodRole,
  ): Promise<BillingPaymentMethod | null>;
  listByOrgId(orgId: string): Promise<BillingPaymentMethod[]>;
  put(
    billingPaymentMethod: BillingPaymentMethod,
  ): Promise<BillingPaymentMethod>;
}
