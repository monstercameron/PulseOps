import { type Pool } from "pg";

import {
  feedbackEventSchema,
  type FeedbackEvent,
} from "@/features/feedback/domain/feedback-event";
import { type FeedbackRepository } from "@/features/feedback/repositories/feedback-repository";
import {
  fromPostgresTimestamp,
  mapPostgresRows,
  toPostgresJson,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresFeedbackRepositoryInput = Readonly<{
  pool: Pool;
}>;

export function createPostgresFeedbackRepository({
  pool,
}: CreatePostgresFeedbackRepositoryInput): FeedbackRepository {
  return {
    async listByOrgId(orgId) {
      const result = await pool.query(
        `
          select *
          from feedback_events
          where org_id = $1
          order by created_at asc
        `,
        [orgId],
      );

      return mapPostgresRows(result.rows, mapFeedbackEventRow);
    },
    async listByRecommendationId(recommendationId) {
      const result = await pool.query(
        `
          select *
          from feedback_events
          where recommendation_id = $1
          order by created_at asc
        `,
        [recommendationId],
      );

      return mapPostgresRows(result.rows, mapFeedbackEventRow);
    },
    async put(event) {
      const parsedEvent = feedbackEventSchema.parse(event);

      await pool.query(
        `
          insert into feedback_events (
            id,
            org_id,
            recommendation_id,
            actor_id,
            action,
            edit_payload,
            reason,
            created_at,
            version
          ) values (
            $1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9
          )
          on conflict (id) do update set
            org_id = excluded.org_id,
            recommendation_id = excluded.recommendation_id,
            actor_id = excluded.actor_id,
            action = excluded.action,
            edit_payload = excluded.edit_payload,
            reason = excluded.reason,
            created_at = excluded.created_at,
            version = excluded.version
        `,
        [
          parsedEvent.id,
          parsedEvent.orgId,
          parsedEvent.recommendationId,
          parsedEvent.actorId,
          parsedEvent.action,
          parsedEvent.editPayload === undefined
            ? null
            : toPostgresJson(parsedEvent.editPayload),
          parsedEvent.reason ?? null,
          parsedEvent.createdAt,
          parsedEvent.version,
        ],
      );

      return parsedEvent;
    },
  };
}

function mapFeedbackEventRow(row: Record<string, unknown>): FeedbackEvent {
  return feedbackEventSchema.parse({
    action: row.action,
    actorId: row.actor_id,
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    editPayload: row.edit_payload ?? undefined,
    id: row.id,
    orgId: row.org_id,
    reason: row.reason ?? undefined,
    recommendationId: row.recommendation_id,
    version: row.version,
  });
}
