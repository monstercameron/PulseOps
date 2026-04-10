import path from "node:path";

import {
  documentSchema,
  type DocumentRecord,
} from "@/features/documents/domain/document";
import { type DocumentRepository } from "@/features/documents/repositories/document-repository";
import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";

type LocalDocumentRepositoryOptions = {
  rootDirectory: string;
};

export function createLocalDocumentRepository({
  rootDirectory,
}: LocalDocumentRepositoryOptions): DocumentRepository {
  const collection = createLocalJsonCollection({
    filePath: path.join(rootDirectory, "documents.json"),
    recordSchema: documentSchema,
  });

  return {
    async findByOrgIdAndChecksum(orgId, checksumSha256) {
      const documents = await collection.list();

      return (
        documents.find(
          (document) =>
            document.orgId === orgId &&
            document.checksumSha256 === checksumSha256,
        ) ?? null
      );
    },
    async getById(id) {
      return collection.getById(id);
    },
    async listByOrgId(orgId) {
      const documents = await collection.list();

      return documents.filter((document) => document.orgId === orgId);
    },
    async put(document) {
      return collection.put(documentSchema.parse(document));
    },
  };
}

export type { DocumentRecord };
