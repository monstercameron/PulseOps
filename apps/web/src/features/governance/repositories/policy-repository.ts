import { type ProcessingPolicy } from "@/features/governance/domain/processing-policy";

export interface PolicyRepository {
  getById(id: string): Promise<ProcessingPolicy | null>;
  listByOrgId(orgId: string): Promise<ProcessingPolicy[]>;
  put(policy: ProcessingPolicy): Promise<ProcessingPolicy>;
}
