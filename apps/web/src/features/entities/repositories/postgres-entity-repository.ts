import { type Pool } from "pg";

import {
  canonicalEntitySchema,
  type CanonicalEntity,
} from "@/features/entities/domain/canonical-entity";
import { type EntityRepository } from "@/features/entities/repositories/entity-repository";
import {
  fromPostgresTimestamp,
  mapPostgresRows,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresEntityRepositoryInput = {
  pool: Pool;
};

export function createPostgresEntityRepository({
  pool,
}: CreatePostgresEntityRepositoryInput): EntityRepository {
  return {
    async getById(id) {
      const result = await pool.query(
        `
          select *
          from entities
          where id = $1
        `,
        [id],
      );

      return result.rows[0] === undefined ? null : mapEntityRow(result.rows[0]);
    },
    async listByOrgId(orgId) {
      const result = await pool.query(
        `
          select *
          from entities
          where org_id = $1
          order by created_at asc
        `,
        [orgId],
      );

      return mapPostgresRows(result.rows, mapEntityRow);
    },
    async put(entity) {
      const parsedEntity = canonicalEntitySchema.parse(entity);

      await pool.query(
        `
          insert into entities (
            id,
            org_id,
            entity_type,
            canonical_key,
            display_name,
            aliases,
            source_document_ids,
            version,
            created_at,
            updated_at
          ) values (
            $1, $2, $3, $4, $5, $6::text[], $7::text[], $8, $9, $10
          )
          on conflict (id) do update set
            org_id = excluded.org_id,
            entity_type = excluded.entity_type,
            canonical_key = excluded.canonical_key,
            display_name = excluded.display_name,
            aliases = excluded.aliases,
            source_document_ids = excluded.source_document_ids,
            version = excluded.version,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at
        `,
        [
          parsedEntity.id,
          parsedEntity.orgId,
          parsedEntity.entityType,
          parsedEntity.canonicalKey,
          parsedEntity.displayName,
          parsedEntity.aliases,
          parsedEntity.sourceDocumentIds,
          parsedEntity.version,
          parsedEntity.createdAt,
          parsedEntity.updatedAt,
        ],
      );

      return parsedEntity;
    },
  };
}

function mapEntityRow(row: Record<string, unknown>): CanonicalEntity {
  return canonicalEntitySchema.parse({
    aliases: Array.isArray(row.aliases) ? row.aliases : [],
    canonicalKey: row.canonical_key,
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    displayName: row.display_name,
    entityType: row.entity_type,
    id: row.id,
    orgId: row.org_id,
    sourceDocumentIds: Array.isArray(row.source_document_ids)
      ? row.source_document_ids
      : [],
    updatedAt: fromPostgresTimestamp(row.updated_at as Date | string),
    version: row.version,
  });
}
