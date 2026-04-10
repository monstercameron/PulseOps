import { type DocumentRecord } from "@/features/documents/domain/document";

export interface DocumentRepository {
  findByOrgIdAndChecksum(
    orgId: string,
    checksumSha256: string,
  ): Promise<DocumentRecord | null>;
  getById(id: string): Promise<DocumentRecord | null>;
  listByOrgId(orgId: string): Promise<DocumentRecord[]>;
  put(document: DocumentRecord): Promise<DocumentRecord>;
}
