import { type IngestionJob } from "@/features/ingestion/domain/ingestion-job";

export interface IngestionJobRepository {
  getById(id: string): Promise<IngestionJob | null>;
  listByDocumentId(documentId: string): Promise<IngestionJob[]>;
  listByOrgId(orgId: string): Promise<IngestionJob[]>;
  put(job: IngestionJob): Promise<IngestionJob>;
}
