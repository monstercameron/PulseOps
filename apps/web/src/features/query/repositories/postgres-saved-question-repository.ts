import { type Pool } from "pg";

import {
  savedQuestionSchema,
  type SavedQuestion,
} from "@/features/query/domain/saved-question";
import { type SavedQuestionRepository } from "@/features/query/repositories/saved-question-repository";
import {
  fromPostgresTimestamp,
  mapPostgresRows,
  toPostgresJson,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresSavedQuestionRepositoryInput = Readonly<{
  pool: Pool;
}>;

export function createPostgresSavedQuestionRepository({
  pool,
}: CreatePostgresSavedQuestionRepositoryInput): SavedQuestionRepository {
  return {
    async deleteById(id) {
      await pool.query(
        `DELETE FROM saved_questions WHERE id = $1`,
        [id],
      );
    },
    async getById(id) {
      const result = await pool.query(
        `
          select *
          from saved_questions
          where id = $1
        `,
        [id],
      );

      return result.rows[0] === undefined
        ? null
        : mapSavedQuestionRow(result.rows[0]);
    },
    async listByOrgId(orgId) {
      const result = await pool.query(
        `
          select *
          from saved_questions
          where org_id = $1
          order by created_at asc
        `,
        [orgId],
      );

      return mapPostgresRows(result.rows, mapSavedQuestionRow);
    },
    async put(savedQuestion) {
      const parsedSavedQuestion = savedQuestionSchema.parse(savedQuestion);

      await pool.query(
        `
          insert into saved_questions (
            id,
            org_id,
            question,
            query_plan,
            created_at,
            version
          ) values (
            $1, $2, $3, $4::jsonb, $5, $6
          )
          on conflict (id) do update set
            org_id = excluded.org_id,
            question = excluded.question,
            query_plan = excluded.query_plan,
            created_at = excluded.created_at,
            version = excluded.version
        `,
        [
          parsedSavedQuestion.id,
          parsedSavedQuestion.orgId,
          parsedSavedQuestion.question,
          toPostgresJson(parsedSavedQuestion.queryPlan),
          parsedSavedQuestion.createdAt,
          parsedSavedQuestion.version,
        ],
      );

      return parsedSavedQuestion;
    },
  };
}

function mapSavedQuestionRow(row: Record<string, unknown>): SavedQuestion {
  return savedQuestionSchema.parse({
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    id: row.id,
    orgId: row.org_id,
    queryPlan: row.query_plan,
    question: row.question,
    version: row.version,
  });
}
