import { type Pool } from "pg";

import {
  outcomeObservationSchema,
  type OutcomeObservation,
} from "@/features/outcomes/domain/outcome-tracking";
import { type OutcomeRepository } from "@/features/outcomes/repositories/outcome-repository";
import {
  fromPostgresNumber,
  fromPostgresTimestamp,
  mapPostgresRows,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresOutcomeRepositoryInput = Readonly<{
  pool: Pool;
}>;

export function createPostgresOutcomeRepository({
  pool,
}: CreatePostgresOutcomeRepositoryInput): OutcomeRepository {
  return {
    async listByOrgId(orgId) {
      const result = await pool.query(
        `
          select *
          from outcome_observations
          where org_id = $1
          order by created_at asc
        `,
        [orgId],
      );

      return mapPostgresRows(result.rows, mapOutcomeRow);
    },
    async listByRecommendationId(recommendationId) {
      const result = await pool.query(
        `
          select *
          from outcome_observations
          where recommendation_id = $1
          order by created_at asc
        `,
        [recommendationId],
      );

      return mapPostgresRows(result.rows, mapOutcomeRow);
    },
    async put(outcome) {
      const parsedOutcome = outcomeObservationSchema.parse(outcome);

      await pool.query(
        `
          insert into outcome_observations (
            id,
            org_id,
            recommendation_id,
            outcome_status,
            window_days,
            value_change_cents,
            notes,
            observed_at,
            created_at,
            version
          ) values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
          )
          on conflict (id) do update set
            org_id = excluded.org_id,
            recommendation_id = excluded.recommendation_id,
            outcome_status = excluded.outcome_status,
            window_days = excluded.window_days,
            value_change_cents = excluded.value_change_cents,
            notes = excluded.notes,
            observed_at = excluded.observed_at,
            created_at = excluded.created_at,
            version = excluded.version
        `,
        [
          parsedOutcome.id,
          parsedOutcome.orgId,
          parsedOutcome.recommendationId,
          parsedOutcome.outcomeStatus,
          parsedOutcome.windowDays,
          parsedOutcome.valueChangeCents ?? null,
          parsedOutcome.notes ?? null,
          parsedOutcome.observedAt,
          parsedOutcome.createdAt,
          parsedOutcome.version,
        ],
      );

      return parsedOutcome;
    },
  };
}

function mapOutcomeRow(row: Record<string, unknown>): OutcomeObservation {
  return outcomeObservationSchema.parse({
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    id: row.id,
    notes: row.notes ?? undefined,
    observedAt: fromPostgresTimestamp(row.observed_at as Date | string),
    orgId: row.org_id,
    outcomeStatus: row.outcome_status,
    recommendationId: row.recommendation_id,
    valueChangeCents: fromPostgresNumber(
      row.value_change_cents as number | string | null | undefined,
    ),
    windowDays: fromPostgresNumber(
      row.window_days as number | string | null | undefined,
    ),
    version: row.version,
  });
}
