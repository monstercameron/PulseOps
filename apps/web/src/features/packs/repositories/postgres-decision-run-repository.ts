import { type Pool } from "pg";

import {
  decisionRunSchema,
  type DecisionRun,
} from "@/features/packs/domain/decision-run";
import { type DecisionRunRepository } from "@/features/packs/repositories/decision-run-repository";
import {
  fromPostgresNumber,
  fromPostgresTimestamp,
  mapPostgresRows,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresDecisionRunRepositoryInput = Readonly<{
  pool: Pool;
}>;

export function createPostgresDecisionRunRepository({
  pool,
}: CreatePostgresDecisionRunRepositoryInput): DecisionRunRepository {
  return {
    async getById(id) {
      const result = await pool.query(
        `
          select *
          from decision_runs
          where id = $1
        `,
        [id],
      );

      return result.rows[0] === undefined
        ? null
        : mapDecisionRunRow(result.rows[0]);
    },
    async listByOrgId(orgId) {
      const result = await pool.query(
        `
          select *
          from decision_runs
          where org_id = $1
          order by created_at desc
        `,
        [orgId],
      );

      return mapPostgresRows(result.rows, mapDecisionRunRow);
    },
    async put(decisionRun) {
      const parsedDecisionRun = decisionRunSchema.parse(decisionRun);

      await pool.query(
        `
          insert into decision_runs (
            id,
            org_id,
            pack_id,
            pack_key,
            status,
            summary,
            source_document_ids,
            supporting_fact_ids,
            recommendation_count,
            failure_reason,
            created_at,
            started_at,
            completed_at,
            updated_at,
            version
          ) values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
          )
          on conflict (id) do update set
            org_id = excluded.org_id,
            pack_id = excluded.pack_id,
            pack_key = excluded.pack_key,
            status = excluded.status,
            summary = excluded.summary,
            source_document_ids = excluded.source_document_ids,
            supporting_fact_ids = excluded.supporting_fact_ids,
            recommendation_count = excluded.recommendation_count,
            failure_reason = excluded.failure_reason,
            created_at = excluded.created_at,
            started_at = excluded.started_at,
            completed_at = excluded.completed_at,
            updated_at = excluded.updated_at,
            version = excluded.version
        `,
        [
          parsedDecisionRun.id,
          parsedDecisionRun.orgId,
          parsedDecisionRun.packId ?? null,
          parsedDecisionRun.packKey,
          parsedDecisionRun.status,
          parsedDecisionRun.summary,
          parsedDecisionRun.sourceDocumentIds,
          parsedDecisionRun.supportingFactIds,
          parsedDecisionRun.recommendationCount,
          parsedDecisionRun.failureReason ?? null,
          parsedDecisionRun.createdAt,
          parsedDecisionRun.startedAt ?? null,
          parsedDecisionRun.completedAt ?? null,
          parsedDecisionRun.updatedAt,
          parsedDecisionRun.version,
        ],
      );

      return parsedDecisionRun;
    },
  };
}

function mapDecisionRunRow(row: Record<string, unknown>): DecisionRun {
  return decisionRunSchema.parse({
    completedAt:
      row.completed_at === null
        ? undefined
        : fromPostgresTimestamp(row.completed_at as Date | string),
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    failureReason: row.failure_reason ?? undefined,
    id: row.id,
    orgId: row.org_id,
    packId: row.pack_id ?? undefined,
    packKey: row.pack_key,
    recommendationCount: fromPostgresNumber(
      row.recommendation_count as number | string | null | undefined,
    ),
    sourceDocumentIds: row.source_document_ids,
    startedAt:
      row.started_at === null
        ? undefined
        : fromPostgresTimestamp(row.started_at as Date | string),
    status: row.status,
    summary: row.summary,
    supportingFactIds: row.supporting_fact_ids,
    updatedAt: fromPostgresTimestamp(row.updated_at as Date | string),
    version: row.version,
  });
}
