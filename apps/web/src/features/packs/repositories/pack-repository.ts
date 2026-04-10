import { type PackRecord } from "@/features/packs/domain/pack-record";

export interface PackRepository {
  getById(id: string): Promise<PackRecord | null>;
  listByOrgId(orgId: string): Promise<PackRecord[]>;
  put(packRecord: PackRecord): Promise<PackRecord>;
}
