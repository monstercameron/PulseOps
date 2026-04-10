import path from "node:path";

import {
  canonicalEntitySchema,
  type CanonicalEntity,
} from "@/features/entities/domain/canonical-entity";
import { type EntityRepository } from "@/features/entities/repositories/entity-repository";
import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";

type LocalEntityRepositoryOptions = {
  rootDirectory: string;
};

export function createLocalEntityRepository({
  rootDirectory,
}: LocalEntityRepositoryOptions): EntityRepository {
  const collection = createLocalJsonCollection({
    filePath: path.join(rootDirectory, "entities.json"),
    recordSchema: canonicalEntitySchema,
  });

  return {
    async getById(id) {
      return collection.getById(id);
    },
    async listByOrgId(orgId) {
      const entities = await collection.list();

      return entities.filter((entity) => entity.orgId === orgId);
    },
    async put(entity) {
      return collection.put(canonicalEntitySchema.parse(entity));
    },
  };
}

export type { CanonicalEntity };
