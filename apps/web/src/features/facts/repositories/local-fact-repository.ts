import path from "node:path";

import {
  canonicalFactRecordSchema,
  type CanonicalFactRecord,
} from "@/features/facts/domain/canonical-fact-record";
import { type FactRepository } from "@/features/facts/repositories/fact-repository";
import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";

type LocalFactRepositoryOptions = {
  rootDirectory: string;
};

export function createLocalFactRepository({
  rootDirectory,
}: LocalFactRepositoryOptions): FactRepository {
  const collection = createLocalJsonCollection({
    filePath: path.join(rootDirectory, "facts.json"),
    recordSchema: canonicalFactRecordSchema,
  });

  return {
    async getById(id) {
      return collection.getById(id);
    },
    async listByDocumentId(documentId) {
      const facts = await collection.list();

      return facts.filter((fact) => fact.documentId === documentId);
    },
    async listByEntityId(entityId) {
      const facts = await collection.list();

      return facts.filter((fact) => fact.entityId === entityId);
    },
    async listByOrgId(orgId) {
      const facts = await collection.list();

      return facts.filter((fact) => fact.orgId === orgId);
    },
    async put(fact) {
      return collection.put(canonicalFactRecordSchema.parse(fact));
    },
  };
}

export type { CanonicalFactRecord };
