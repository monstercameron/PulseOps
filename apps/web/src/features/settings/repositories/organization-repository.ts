import { type OrganizationRecord } from "@/features/settings/domain/organization-record";

export interface OrganizationRepository {
  getById(id: string): Promise<OrganizationRecord | null>;
  list(): Promise<OrganizationRecord[]>;
  put(organizationRecord: OrganizationRecord): Promise<OrganizationRecord>;
}
