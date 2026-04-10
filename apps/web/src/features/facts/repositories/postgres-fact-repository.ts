import { type Pool } from "pg";

import {
  canonicalFactRecordSchema,
  type CanonicalFactRecord,
} from "@/features/facts/domain/canonical-fact-record";
import { type FactRepository } from "@/features/facts/repositories/fact-repository";
import {
  fromPostgresNumber,
  fromPostgresTimestamp,
  mapPostgresRows,
  toPostgresJson,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresFactRepositoryInput = {
  pool: Pool;
};

export function createPostgresFactRepository({
  pool,
}: CreatePostgresFactRepositoryInput): FactRepository {
  return {
    async getById(id) {
      const result = await pool.query(
        `
          select *
          from canonical_facts
          where id = $1
        `,
        [id],
      );

      return result.rows[0] === undefined ? null : mapFactRow(result.rows[0]);
    },
    async listByDocumentId(documentId) {
      const result = await pool.query(
        `
          select *
          from canonical_facts
          where document_id = $1
          order by created_at asc
        `,
        [documentId],
      );

      return mapPostgresRows(result.rows, mapFactRow);
    },
    async listByEntityId(entityId) {
      const result = await pool.query(
        `
          select *
          from canonical_facts
          where entity_id = $1
          order by created_at asc
        `,
        [entityId],
      );

      return mapPostgresRows(result.rows, mapFactRow);
    },
    async listByOrgId(orgId) {
      const result = await pool.query(
        `
          select *
          from canonical_facts
          where org_id = $1
          order by created_at asc
        `,
        [orgId],
      );

      return mapPostgresRows(result.rows, mapFactRow);
    },
    async put(fact) {
      const parsedFact = canonicalFactRecordSchema.parse(fact);

      await pool.query(
        `
          insert into canonical_facts (
            id,
            org_id,
            document_id,
            entity_id,
            entity_type,
            canonical_fact_type_id,
            label,
            document_family,
            source_field_key,
            value,
            confidence_score,
            citations,
            version,
            created_at,
            updated_at
          ) values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12::jsonb, $13, $14, $15
          )
          on conflict (id) do update set
            org_id = excluded.org_id,
            document_id = excluded.document_id,
            entity_id = excluded.entity_id,
            entity_type = excluded.entity_type,
            canonical_fact_type_id = excluded.canonical_fact_type_id,
            label = excluded.label,
            document_family = excluded.document_family,
            source_field_key = excluded.source_field_key,
            value = excluded.value,
            confidence_score = excluded.confidence_score,
            citations = excluded.citations,
            version = excluded.version,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at
        `,
        [
          parsedFact.id,
          parsedFact.orgId,
          parsedFact.documentId,
          parsedFact.entityId,
          parsedFact.entityType,
          parsedFact.canonicalFactTypeId,
          parsedFact.label ?? null,
          parsedFact.documentFamily,
          parsedFact.sourceFieldKey,
          toPostgresJson(parsedFact.value),
          parsedFact.confidenceScore,
          toPostgresJson(parsedFact.citations),
          parsedFact.version,
          parsedFact.createdAt,
          parsedFact.updatedAt,
        ],
      );

      return parsedFact;
    },
  };
}

function mapFactRow(row: Record<string, unknown>): CanonicalFactRecord {
  return canonicalFactRecordSchema.parse({
    canonicalFactTypeId: row.canonical_fact_type_id,
    citations: row.citations,
    confidenceScore: fromPostgresNumber(
      row.confidence_score as number | string | null | undefined,
    ),
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    documentFamily: row.document_family,
    documentId: row.document_id,
    entityId: row.entity_id,
    entityType: row.entity_type,
    id: row.id,
    label: row.label ?? undefined,
    orgId: row.org_id,
    sourceFieldKey: row.source_field_key,
    updatedAt: fromPostgresTimestamp(row.updated_at as Date | string),
    value: row.value,
    version: row.version,
  });
}
