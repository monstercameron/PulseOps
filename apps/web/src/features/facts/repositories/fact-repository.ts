import { type CanonicalFactRecord } from "@/features/facts/domain/canonical-fact-record";

export interface FactRepository {
  getById(id: string): Promise<CanonicalFactRecord | null>;
  listByDocumentId(documentId: string): Promise<CanonicalFactRecord[]>;
  listByEntityId(entityId: string): Promise<CanonicalFactRecord[]>;
  listByOrgId(orgId: string): Promise<CanonicalFactRecord[]>;
  put(fact: CanonicalFactRecord): Promise<CanonicalFactRecord>;
}
