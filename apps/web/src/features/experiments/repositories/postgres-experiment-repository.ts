import { type Pool } from "pg";

import {
  experimentRecordSchema,
  type ExperimentRecord,
} from "@/features/experiments/domain/experiment-record";
import { type ExperimentRepository } from "@/features/experiments/repositories/experiment-repository";
import {
  fromPostgresTimestamp,
  mapPostgresRows,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresExperimentRepositoryInput = Readonly<{
  pool: Pool;
}>;

export function createPostgresExperimentRepository({
  pool,
}: CreatePostgresExperimentRepositoryInput): ExperimentRepository {
  return {
    async getById(id) {
      const result = await pool.query(
        `
          select *
          from experiments
          where id = $1
        `,
        [id],
      );

      return result.rows[0] === undefined
        ? null
        : mapExperimentRow(result.rows[0]);
    },
    async listByOrgId(orgId) {
      const result = await pool.query(
        `
          select *
          from experiments
          where org_id = $1
          order by created_at desc
        `,
        [orgId],
      );

      return mapPostgresRows(result.rows, mapExperimentRow);
    },
    async put(experiment) {
      const parsedExperiment = experimentRecordSchema.parse(experiment);

      await pool.query(
        `
          insert into experiments (
            id,
            org_id,
            prompt_family,
            variant_id,
            hypothesis,
            primary_metric,
            status,
            created_at,
            started_at,
            completed_at,
            updated_at,
            version
          ) values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
          )
          on conflict (id) do update set
            org_id = excluded.org_id,
            prompt_family = excluded.prompt_family,
            variant_id = excluded.variant_id,
            hypothesis = excluded.hypothesis,
            primary_metric = excluded.primary_metric,
            status = excluded.status,
            created_at = excluded.created_at,
            started_at = excluded.started_at,
            completed_at = excluded.completed_at,
            updated_at = excluded.updated_at,
            version = excluded.version
        `,
        [
          parsedExperiment.id,
          parsedExperiment.orgId,
          parsedExperiment.promptFamily,
          parsedExperiment.variantId,
          parsedExperiment.hypothesis,
          parsedExperiment.primaryMetric,
          parsedExperiment.status,
          parsedExperiment.createdAt,
          parsedExperiment.startedAt ?? null,
          parsedExperiment.completedAt ?? null,
          parsedExperiment.updatedAt,
          parsedExperiment.version,
        ],
      );

      return parsedExperiment;
    },
  };
}

function mapExperimentRow(row: Record<string, unknown>): ExperimentRecord {
  return experimentRecordSchema.parse({
    completedAt:
      row.completed_at === null
        ? undefined
        : fromPostgresTimestamp(row.completed_at as Date | string),
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    hypothesis: row.hypothesis,
    id: row.id,
    orgId: row.org_id,
    primaryMetric: row.primary_metric,
    promptFamily: row.prompt_family,
    startedAt:
      row.started_at === null
        ? undefined
        : fromPostgresTimestamp(row.started_at as Date | string),
    status: row.status,
    updatedAt: fromPostgresTimestamp(row.updated_at as Date | string),
    variantId: row.variant_id,
    version: row.version,
  });
}
