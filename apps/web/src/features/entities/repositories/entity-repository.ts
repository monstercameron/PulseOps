import { type CanonicalEntity } from "@/features/entities/domain/canonical-entity";

export interface EntityRepository {
  getById(id: string): Promise<CanonicalEntity | null>;
  listByOrgId(orgId: string): Promise<CanonicalEntity[]>;
  put(entity: CanonicalEntity): Promise<CanonicalEntity>;
}
