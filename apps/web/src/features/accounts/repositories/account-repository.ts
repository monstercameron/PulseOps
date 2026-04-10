import { type OrganizationAccountRecord } from "@/features/accounts/domain/organization-account";

export interface AccountRepository {
  getByOrgIdAndEmail(
    orgId: string,
    email: string,
  ): Promise<OrganizationAccountRecord | null>;
  getByOrgIdAndUserId(
    orgId: string,
    userId: string,
  ): Promise<OrganizationAccountRecord | null>;
  listByOrgId(orgId: string): Promise<OrganizationAccountRecord[]>;
  put(
    organizationAccount: OrganizationAccountRecord,
  ): Promise<OrganizationAccountRecord>;
}
