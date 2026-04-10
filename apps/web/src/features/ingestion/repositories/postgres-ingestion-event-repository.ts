import { type Pool } from "pg";

import {
  ingestionEventSchema,
  type IngestionEvent,
} from "@/features/ingestion/domain/ingestion-event";
import { type IngestionEventRepository } from "@/features/ingestion/repositories/ingestion-event-repository";
import {
  fromPostgresNumber,
  fromPostgresTimestamp,
  mapPostgresRows,
  toPostgresJson,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresIngestionEventRepositoryInput = {
  pool: Pool;
};

export function createPostgresIngestionEventRepository({
  pool,
}: CreatePostgresIngestionEventRepositoryInput): IngestionEventRepository {
  return {
    async listByDocumentId(documentId) {
      const result = await pool.query(
        `
          select *
          from ingestion_events
          where document_id = $1
          order by created_at asc
        `,
        [documentId],
      );

      return mapPostgresRows(result.rows, mapIngestionEventRow);
    },
    async listByOrgId(orgId) {
      const result = await pool.query(
        `
          select *
          from ingestion_events
          where org_id = $1
          order by created_at asc
        `,
        [orgId],
      );

      return mapPostgresRows(result.rows, mapIngestionEventRow);
    },
    async put(event) {
      const parsedEvent = ingestionEventSchema.parse(event);

      await pool.query(
        `
          insert into ingestion_events (
            id,
            org_id,
            document_id,
            job_id,
            kind,
            source,
            file_name,
            checksum_sha256,
            size_bytes,
            archive_after_days,
            retention_policy_key,
            deduplicated,
            estimated_ingest_cost_usd,
            metadata,
            version,
            created_at
          ) values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15, $16
          )
          on conflict (id) do update set
            org_id = excluded.org_id,
            document_id = excluded.document_id,
            job_id = excluded.job_id,
            kind = excluded.kind,
            source = excluded.source,
            file_name = excluded.file_name,
            checksum_sha256 = excluded.checksum_sha256,
            size_bytes = excluded.size_bytes,
            archive_after_days = excluded.archive_after_days,
            retention_policy_key = excluded.retention_policy_key,
            deduplicated = excluded.deduplicated,
            estimated_ingest_cost_usd = excluded.estimated_ingest_cost_usd,
            metadata = excluded.metadata,
            version = excluded.version,
            created_at = excluded.created_at
        `,
        [
          parsedEvent.id,
          parsedEvent.orgId,
          parsedEvent.documentId,
          parsedEvent.jobId,
          parsedEvent.kind,
          parsedEvent.source,
          parsedEvent.fileName,
          parsedEvent.checksumSha256,
          parsedEvent.sizeBytes,
          parsedEvent.archiveAfterDays,
          parsedEvent.retentionPolicyKey,
          parsedEvent.deduplicated,
          parsedEvent.estimatedIngestCostUsd,
          toPostgresJson(parsedEvent.metadata),
          parsedEvent.version,
          parsedEvent.createdAt,
        ],
      );

      return parsedEvent;
    },
  };
}

function mapIngestionEventRow(row: Record<string, unknown>): IngestionEvent {
  return ingestionEventSchema.parse({
    archiveAfterDays: fromPostgresNumber(
      row.archive_after_days as number | string | null | undefined,
    ),
    checksumSha256: row.checksum_sha256,
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    deduplicated: row.deduplicated,
    documentId: row.document_id,
    estimatedIngestCostUsd: fromPostgresNumber(
      row.estimated_ingest_cost_usd as number | string | null | undefined,
    ),
    fileName: row.file_name,
    id: row.id,
    jobId: row.job_id,
    kind: row.kind,
    metadata: row.metadata,
    orgId: row.org_id,
    retentionPolicyKey: row.retention_policy_key,
    sizeBytes: fromPostgresNumber(
      row.size_bytes as number | string | null | undefined,
    ),
    source: row.source,
    version: row.version,
  });
}
