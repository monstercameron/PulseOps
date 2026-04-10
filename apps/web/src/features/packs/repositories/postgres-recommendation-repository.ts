import { type Pool } from "pg";

import {
  recommendationRecordSchema,
  type RecommendationRecord,
} from "@/features/packs/domain/recommendation-record";
import { type RecommendationRepository } from "@/features/packs/repositories/recommendation-repository";
import {
  fromPostgresNumber,
  fromPostgresTimestamp,
  mapPostgresRows,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresRecommendationRepositoryInput = Readonly<{
  pool: Pool;
}>;

export function createPostgresRecommendationRepository({
  pool,
}: CreatePostgresRecommendationRepositoryInput): RecommendationRepository {
  return {
    async listByDecisionRunId(decisionRunId) {
      const result = await pool.query(
        `
          select *
          from recommendations
          where decision_run_id = $1
          order by created_at asc
        `,
        [decisionRunId],
      );

      return mapPostgresRows(result.rows, mapRecommendationRow);
    },
    async listByOrgId(orgId) {
      const result = await pool.query(
        `
          select *
          from recommendations
          where org_id = $1
          order by created_at desc
        `,
        [orgId],
      );

      return mapPostgresRows(result.rows, mapRecommendationRow);
    },
    async put(recommendation) {
      const parsedRecommendation =
        recommendationRecordSchema.parse(recommendation);

      await pool.query(
        `
          insert into recommendations (
            id,
            org_id,
            decision_run_id,
            kind,
            title,
            summary,
            citations,
            actions,
            confidence_score,
            priority_score,
            status,
            supporting_fact_ids,
            created_at,
            updated_at,
            version
          ) values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
          )
          on conflict (id) do update set
            org_id = excluded.org_id,
            decision_run_id = excluded.decision_run_id,
            kind = excluded.kind,
            title = excluded.title,
            summary = excluded.summary,
            citations = excluded.citations,
            actions = excluded.actions,
            confidence_score = excluded.confidence_score,
            priority_score = excluded.priority_score,
            status = excluded.status,
            supporting_fact_ids = excluded.supporting_fact_ids,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at,
            version = excluded.version
        `,
        [
          parsedRecommendation.id,
          parsedRecommendation.orgId,
          parsedRecommendation.decisionRunId,
          parsedRecommendation.kind,
          parsedRecommendation.title,
          parsedRecommendation.summary,
          parsedRecommendation.citations,
          parsedRecommendation.actions,
          parsedRecommendation.confidenceScore,
          parsedRecommendation.priorityScore,
          parsedRecommendation.status,
          parsedRecommendation.supportingFactIds,
          parsedRecommendation.createdAt,
          parsedRecommendation.updatedAt,
          parsedRecommendation.version,
        ],
      );

      return parsedRecommendation;
    },
  };
}

function mapRecommendationRow(
  row: Record<string, unknown>,
): RecommendationRecord {
  return recommendationRecordSchema.parse({
    actions: row.actions,
    citations: row.citations,
    confidenceScore: fromPostgresNumber(
      row.confidence_score as number | string | null | undefined,
    ),
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    decisionRunId: row.decision_run_id,
    id: row.id,
    kind: row.kind,
    orgId: row.org_id,
    priorityScore: fromPostgresNumber(
      row.priority_score as number | string | null | undefined,
    ),
    status: row.status,
    summary: row.summary,
    supportingFactIds: row.supporting_fact_ids,
    title: row.title,
    updatedAt: fromPostgresTimestamp(row.updated_at as Date | string),
    version: row.version,
  });
}
