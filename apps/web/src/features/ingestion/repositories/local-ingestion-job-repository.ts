import path from "node:path";

import {
  ingestionJobSchema,
  type IngestionJob,
} from "@/features/ingestion/domain/ingestion-job";
import { type IngestionJobRepository } from "@/features/ingestion/repositories/ingestion-job-repository";
import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";

type LocalIngestionJobRepositoryOptions = {
  rootDirectory: string;
};

export function createLocalIngestionJobRepository({
  rootDirectory,
}: LocalIngestionJobRepositoryOptions): IngestionJobRepository {
  const collection = createLocalJsonCollection({
    filePath: path.join(rootDirectory, "ingestion-jobs.json"),
    recordSchema: ingestionJobSchema,
  });

  return {
    async getById(id) {
      return collection.getById(id);
    },
    async listByDocumentId(documentId) {
      const jobs = await collection.list();

      return jobs.filter((job) => job.documentId === documentId);
    },
    async listByOrgId(orgId) {
      const jobs = await collection.list();

      return jobs.filter((job) => job.orgId === orgId);
    },
    async put(job) {
      return collection.put(ingestionJobSchema.parse(job));
    },
  };
}

export type { IngestionJob };
