import path from "node:path";

import {
  materializedMartSchema,
  type MaterializedMart,
} from "@/features/marts/domain/materialized-mart";
import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";
import { type MartRepository } from "@/features/marts/repositories/mart-repository";

type LocalMartRepositoryOptions = {
  rootDirectory: string;
};

export function createLocalMartRepository({
  rootDirectory,
}: LocalMartRepositoryOptions): MartRepository {
  const collection = createLocalJsonCollection({
    filePath: path.join(rootDirectory, "marts.json"),
    recordSchema: materializedMartSchema,
  });

  return {
    async getById(id) {
      return collection.getById(id);
    },
    async listByOrgId(orgId) {
      const marts = await collection.list();

      return marts.filter((mart) => mart.orgId === orgId);
    },
    async put(mart) {
      return collection.put(materializedMartSchema.parse(mart));
    },
  };
}

export type { MaterializedMart };
