import path from "node:path";

import {
  settingsRecordSchema,
  type SettingsRecord,
} from "@/features/settings/domain/settings-record";
import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";
import { type SettingsRepository } from "@/features/settings/repositories/settings-repository";

type LocalSettingsRepositoryOptions = Readonly<{
  rootDirectory: string;
}>;

export function createLocalSettingsRepository({
  rootDirectory,
}: LocalSettingsRepositoryOptions): SettingsRepository {
  const collection = createLocalJsonCollection({
    filePath: path.join(rootDirectory, "settings-records.json"),
    recordSchema: settingsRecordSchema,
  });

  return {
    async getByOrgId(orgId) {
      const settingsRecords = await collection.list();

      return settingsRecords.find((record) => record.orgId === orgId) ?? null;
    },
    async put(settingsRecord) {
      return collection.put(settingsRecordSchema.parse(settingsRecord));
    },
  };
}

export type { SettingsRecord };
