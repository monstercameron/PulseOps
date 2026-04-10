import { type RetrievalChunk } from "@/features/chunks/domain/retrieval-chunk";

export interface ChunkRepository {
  getById(id: string): Promise<RetrievalChunk | null>;
  listByDocumentId(documentId: string): Promise<RetrievalChunk[]>;
  listByEntityId(entityId: string): Promise<RetrievalChunk[]>;
  listByOrgId(orgId: string): Promise<RetrievalChunk[]>;
  put(chunk: RetrievalChunk): Promise<RetrievalChunk>;
}
