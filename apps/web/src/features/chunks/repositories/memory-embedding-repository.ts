import { type MemoryEmbedding } from "@/features/chunks/domain/memory-embedding";

export interface MemoryEmbeddingRepository {
  listByOrgId(orgId: string): Promise<MemoryEmbedding[]>;
  listBySourceId(sourceId: string): Promise<MemoryEmbedding[]>;
  put(memoryEmbedding: MemoryEmbedding): Promise<MemoryEmbedding>;
}
