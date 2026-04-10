import { type BillingAccount } from "@/features/cost/domain/billing-account";

export interface BillingAccountRepository {
  getByOrgId(orgId: string): Promise<BillingAccount | null>;
  put(billingAccount: BillingAccount): Promise<BillingAccount>;
}
