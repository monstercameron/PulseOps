import path from "node:path";

import {
  ingestionEventSchema,
  type IngestionEvent,
} from "@/features/ingestion/domain/ingestion-event";
import { type IngestionEventRepository } from "@/features/ingestion/repositories/ingestion-event-repository";
import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";

type LocalIngestionEventRepositoryOptions = {
  rootDirectory: string;
};

export function createLocalIngestionEventRepository({
  rootDirectory,
}: LocalIngestionEventRepositoryOptions): IngestionEventRepository {
  const collection = createLocalJsonCollection({
    filePath: path.join(rootDirectory, "ingestion-events.json"),
    recordSchema: ingestionEventSchema,
  });

  return {
    async listByDocumentId(documentId) {
      const events = await collection.list();

      return events.filter((event) => event.documentId === documentId);
    },
    async listByOrgId(orgId) {
      const events = await collection.list();

      return events.filter((event) => event.orgId === orgId);
    },
    async put(event) {
      return collection.put(ingestionEventSchema.parse(event));
    },
  };
}

export type { IngestionEvent };
