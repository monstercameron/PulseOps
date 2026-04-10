import { type IngestionEvent } from "@/features/ingestion/domain/ingestion-event";

export interface IngestionEventRepository {
  listByDocumentId(documentId: string): Promise<IngestionEvent[]>;
  listByOrgId(orgId: string): Promise<IngestionEvent[]>;
  put(event: IngestionEvent): Promise<IngestionEvent>;
}
