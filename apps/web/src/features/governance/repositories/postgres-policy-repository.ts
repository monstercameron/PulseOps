import { type Pool } from "pg";

import {
  processingPolicySchema,
  type ProcessingPolicy,
} from "@/features/governance/domain/processing-policy";
import { type PolicyRepository } from "@/features/governance/repositories/policy-repository";
import {
  fromPostgresTimestamp,
  mapPostgresRows,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresPolicyRepositoryInput = Readonly<{
  pool: Pool;
}>;

export function createPostgresPolicyRepository({
  pool,
}: CreatePostgresPolicyRepositoryInput): PolicyRepository {
  return {
    async getById(id) {
      const result = await pool.query(
        `
          select *
          from processing_policies
          where id = $1
        `,
        [id],
      );

      return result.rows[0] === undefined ? null : mapPolicyRow(result.rows[0]);
    },
    async listByOrgId(orgId) {
      const result = await pool.query(
        `
          select *
          from processing_policies
          where org_id = $1
          order by created_at asc
        `,
        [orgId],
      );

      return mapPostgresRows(result.rows, mapPolicyRow);
    },
    async put(policy) {
      const parsedPolicy = processingPolicySchema.parse(policy);

      await pool.query(
        `
          insert into processing_policies (
            id,
            org_id,
            name,
            scope_kind,
            scope_key,
            parser_route,
            extraction_enabled,
            embeddings_enabled,
            human_review_required,
            redaction_policy_key,
            retention_policy_key,
            created_at,
            updated_at,
            version
          ) values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
          )
          on conflict (id) do update set
            org_id = excluded.org_id,
            name = excluded.name,
            scope_kind = excluded.scope_kind,
            scope_key = excluded.scope_key,
            parser_route = excluded.parser_route,
            extraction_enabled = excluded.extraction_enabled,
            embeddings_enabled = excluded.embeddings_enabled,
            human_review_required = excluded.human_review_required,
            redaction_policy_key = excluded.redaction_policy_key,
            retention_policy_key = excluded.retention_policy_key,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at,
            version = excluded.version
        `,
        [
          parsedPolicy.id,
          parsedPolicy.orgId,
          parsedPolicy.name,
          parsedPolicy.scopeKind,
          parsedPolicy.scopeKey,
          parsedPolicy.parserRoute,
          parsedPolicy.extractionEnabled,
          parsedPolicy.embeddingsEnabled,
          parsedPolicy.humanReviewRequired,
          parsedPolicy.redactionPolicyKey,
          parsedPolicy.retentionPolicyKey,
          parsedPolicy.createdAt,
          parsedPolicy.updatedAt,
          parsedPolicy.version,
        ],
      );

      return parsedPolicy;
    },
  };
}

function mapPolicyRow(row: Record<string, unknown>): ProcessingPolicy {
  return processingPolicySchema.parse({
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    embeddingsEnabled: row.embeddings_enabled,
    extractionEnabled: row.extraction_enabled,
    humanReviewRequired: row.human_review_required,
    id: row.id,
    name: row.name,
    orgId: row.org_id,
    parserRoute: row.parser_route,
    redactionPolicyKey: row.redaction_policy_key,
    retentionPolicyKey: row.retention_policy_key,
    scopeKey: row.scope_key,
    scopeKind: row.scope_kind,
    updatedAt: fromPostgresTimestamp(row.updated_at as Date | string),
    version: row.version,
  });
}
