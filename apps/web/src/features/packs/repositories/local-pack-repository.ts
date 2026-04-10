import path from "node:path";

import {
  packRecordSchema,
  type PackRecord,
} from "@/features/packs/domain/pack-record";
import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";
import { type PackRepository } from "@/features/packs/repositories/pack-repository";

type LocalPackRepositoryOptions = Readonly<{
  rootDirectory: string;
}>;

export function createLocalPackRepository({
  rootDirectory,
}: LocalPackRepositoryOptions): PackRepository {
  const collection = createLocalJsonCollection({
    filePath: path.join(rootDirectory, "packs.json"),
    recordSchema: packRecordSchema,
  });

  return {
    async getById(id) {
      return collection.getById(id);
    },
    async listByOrgId(orgId) {
      const packRecords = await collection.list();

      return packRecords.filter((record) => record.orgId === orgId);
    },
    async put(packRecord) {
      return collection.put(packRecordSchema.parse(packRecord));
    },
  };
}

export type { PackRecord };
