import path from "node:path";

import {
  retrievalChunkSchema,
  type RetrievalChunk,
} from "@/features/chunks/domain/retrieval-chunk";
import { type ChunkRepository } from "@/features/chunks/repositories/chunk-repository";
import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";

type LocalChunkRepositoryOptions = {
  rootDirectory: string;
};

export function createLocalChunkRepository({
  rootDirectory,
}: LocalChunkRepositoryOptions): ChunkRepository {
  const collection = createLocalJsonCollection({
    filePath: path.join(rootDirectory, "chunks.json"),
    recordSchema: retrievalChunkSchema,
  });

  return {
    async getById(id) {
      return collection.getById(id);
    },
    async listByDocumentId(documentId) {
      const chunks = await collection.list();

      return chunks.filter((chunk) => chunk.documentId === documentId);
    },
    async listByEntityId(entityId) {
      const chunks = await collection.list();

      return chunks.filter((chunk) => chunk.entityId === entityId);
    },
    async listByOrgId(orgId) {
      const chunks = await collection.list();

      return chunks.filter((chunk) => chunk.orgId === orgId);
    },
    async put(chunk) {
      return collection.put(retrievalChunkSchema.parse(chunk));
    },
  };
}

export type { RetrievalChunk };
