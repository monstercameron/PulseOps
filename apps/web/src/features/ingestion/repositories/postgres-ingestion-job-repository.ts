import { type Pool } from "pg";

import {
  ingestionJobSchema,
  type IngestionJob,
} from "@/features/ingestion/domain/ingestion-job";
import { type IngestionJobRepository } from "@/features/ingestion/repositories/ingestion-job-repository";
import {
  fromPostgresTimestamp,
  mapPostgresRows,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresIngestionJobRepositoryInput = {
  pool: Pool;
};

export function createPostgresIngestionJobRepository({
  pool,
}: CreatePostgresIngestionJobRepositoryInput): IngestionJobRepository {
  return {
    async getById(id) {
      const result = await pool.query(
        `
          select *
          from ingestion_jobs
          where id = $1
        `,
        [id],
      );

      return result.rows[0] === undefined ? null : mapIngestionJobRow(result.rows[0]);
    },
    async listByDocumentId(documentId) {
      const result = await pool.query(
        `
          select *
          from ingestion_jobs
          where document_id = $1
          order by created_at asc
        `,
        [documentId],
      );

      return mapPostgresRows(result.rows, mapIngestionJobRow);
    },
    async listByOrgId(orgId) {
      const result = await pool.query(
        `
          select *
          from ingestion_jobs
          where org_id = $1
          order by created_at asc
        `,
        [orgId],
      );

      return mapPostgresRows(result.rows, mapIngestionJobRow);
    },
    async put(job) {
      const parsedJob = ingestionJobSchema.parse(job);

      await pool.query(
        `
          insert into ingestion_jobs (
            id,
            org_id,
            document_id,
            status,
            attempt_count,
            failure_reason,
            created_at,
            started_at,
            completed_at,
            last_updated_at
          ) values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
          )
          on conflict (id) do update set
            org_id = excluded.org_id,
            document_id = excluded.document_id,
            status = excluded.status,
            attempt_count = excluded.attempt_count,
            failure_reason = excluded.failure_reason,
            created_at = excluded.created_at,
            started_at = excluded.started_at,
            completed_at = excluded.completed_at,
            last_updated_at = excluded.last_updated_at
        `,
        [
          parsedJob.id,
          parsedJob.orgId,
          parsedJob.documentId,
          parsedJob.status,
          parsedJob.attemptCount,
          parsedJob.failureReason ?? null,
          parsedJob.createdAt,
          parsedJob.startedAt ?? null,
          parsedJob.completedAt ?? null,
          parsedJob.lastUpdatedAt,
        ],
      );

      return parsedJob;
    },
  };
}

function mapIngestionJobRow(row: Record<string, unknown>): IngestionJob {
  return ingestionJobSchema.parse({
    attemptCount: row.attempt_count,
    completedAt:
      row.completed_at === null
        ? undefined
        : fromPostgresTimestamp(row.completed_at as Date | string),
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    documentId: row.document_id,
    failureReason: row.failure_reason ?? undefined,
    id: row.id,
    lastUpdatedAt: fromPostgresTimestamp(row.last_updated_at as Date | string),
    orgId: row.org_id,
    startedAt:
      row.started_at === null
        ? undefined
        : fromPostgresTimestamp(row.started_at as Date | string),
    status: row.status,
  });
}
