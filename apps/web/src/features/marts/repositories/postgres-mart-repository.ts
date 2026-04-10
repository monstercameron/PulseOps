import { type Pool } from "pg";

import {
  materializedMartSchema,
  type MaterializedMart,
} from "@/features/marts/domain/materialized-mart";
import { type MartRepository } from "@/features/marts/repositories/mart-repository";
import {
  fromPostgresNumber,
  fromPostgresTimestamp,
  mapPostgresRows,
  toPostgresJson,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresMartRepositoryInput = Readonly<{
  pool: Pool;
}>;

export function createPostgresMartRepository({
  pool,
}: CreatePostgresMartRepositoryInput): MartRepository {
  return {
    async getById(id) {
      const result = await pool.query(
        `
          select *
          from materialized_marts
          where id = $1
        `,
        [id],
      );

      return result.rows[0] === undefined ? null : mapMartRow(result.rows[0]);
    },
    async listByOrgId(orgId) {
      const result = await pool.query(
        `
          select *
          from materialized_marts
          where org_id = $1
          order by created_at asc
        `,
        [orgId],
      );

      return mapPostgresRows(result.rows, mapMartRow);
    },
    async put(mart) {
      const parsedMart = materializedMartSchema.parse(mart);

      await pool.query(
        `
          insert into materialized_marts (
            id,
            org_id,
            metric_id,
            as_of_date,
            value,
            dimension_values,
            supporting_fact_ids,
            created_at,
            version
          ) values (
            $1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9
          )
          on conflict (id) do update set
            org_id = excluded.org_id,
            metric_id = excluded.metric_id,
            as_of_date = excluded.as_of_date,
            value = excluded.value,
            dimension_values = excluded.dimension_values,
            supporting_fact_ids = excluded.supporting_fact_ids,
            created_at = excluded.created_at,
            version = excluded.version
        `,
        [
          parsedMart.id,
          parsedMart.orgId,
          parsedMart.metricId,
          parsedMart.asOfDate,
          parsedMart.value,
          toPostgresJson(parsedMart.dimensionValues),
          parsedMart.supportingFactIds,
          parsedMart.createdAt,
          parsedMart.version,
        ],
      );

      return parsedMart;
    },
  };
}

function mapMartRow(row: Record<string, unknown>): MaterializedMart {
  return materializedMartSchema.parse({
    asOfDate:
      row.as_of_date instanceof Date
        ? row.as_of_date.toISOString().slice(0, 10)
        : row.as_of_date,
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    dimensionValues: row.dimension_values,
    id: row.id,
    metricId: row.metric_id,
    orgId: row.org_id,
    supportingFactIds: row.supporting_fact_ids,
    value: fromPostgresNumber(
      row.value as number | string | null | undefined,
    ),
    version: row.version,
  });
}
