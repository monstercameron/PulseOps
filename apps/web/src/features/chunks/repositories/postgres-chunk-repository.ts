import { type Pool } from "pg";

import {
  retrievalChunkSchema,
  type RetrievalChunk,
} from "@/features/chunks/domain/retrieval-chunk";
import { type ChunkRepository } from "@/features/chunks/repositories/chunk-repository";
import {
  fromPostgresNumber,
  fromPostgresTimestamp,
  mapPostgresRows,
  toPostgresJson,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresChunkRepositoryInput = {
  pool: Pool;
};

export function createPostgresChunkRepository({
  pool,
}: CreatePostgresChunkRepositoryInput): ChunkRepository {
  return {
    async getById(id) {
      const result = await pool.query(
        `
          select *
          from retrieval_chunks
          where id = $1
        `,
        [id],
      );

      return result.rows[0] === undefined ? null : mapChunkRow(result.rows[0]);
    },
    async listByDocumentId(documentId) {
      const result = await pool.query(
        `
          select *
          from retrieval_chunks
          where document_id = $1
          order by created_at asc
        `,
        [documentId],
      );

      return mapPostgresRows(result.rows, mapChunkRow);
    },
    async listByEntityId(entityId) {
      const result = await pool.query(
        `
          select *
          from retrieval_chunks
          where entity_id = $1
          order by created_at asc
        `,
        [entityId],
      );

      return mapPostgresRows(result.rows, mapChunkRow);
    },
    async listByOrgId(orgId) {
      const result = await pool.query(
        `
          select *
          from retrieval_chunks
          where org_id = $1
          order by created_at asc
        `,
        [orgId],
      );

      return mapPostgresRows(result.rows, mapChunkRow);
    },
    async put(chunk) {
      const parsedChunk = retrievalChunkSchema.parse(chunk);

      await pool.query(
        `
          insert into retrieval_chunks (
            id,
            org_id,
            document_id,
            entity_id,
            entity_type,
            source_kind,
            content,
            canonical_fact_type_ids,
            embedding_model,
            embedding,
            embedding_dimensions,
            citations,
            version,
            created_at,
            updated_at
          ) values (
            $1, $2, $3, $4, $5, $6, $7, $8::text[], $9, $10::double precision[], $11, $12::jsonb, $13, $14, $15
          )
          on conflict (id) do update set
            org_id = excluded.org_id,
            document_id = excluded.document_id,
            entity_id = excluded.entity_id,
            entity_type = excluded.entity_type,
            source_kind = excluded.source_kind,
            content = excluded.content,
            canonical_fact_type_ids = excluded.canonical_fact_type_ids,
            embedding_model = excluded.embedding_model,
            embedding = excluded.embedding,
            embedding_dimensions = excluded.embedding_dimensions,
            citations = excluded.citations,
            version = excluded.version,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at
        `,
        [
          parsedChunk.id,
          parsedChunk.orgId,
          parsedChunk.documentId,
          parsedChunk.entityId,
          parsedChunk.entityType,
          parsedChunk.sourceKind,
          parsedChunk.content,
          parsedChunk.canonicalFactTypeIds,
          parsedChunk.embeddingModel,
          parsedChunk.embedding,
          parsedChunk.embeddingDimensions,
          toPostgresJson(parsedChunk.citations),
          parsedChunk.version,
          parsedChunk.createdAt,
          parsedChunk.updatedAt,
        ],
      );

      return parsedChunk;
    },
  };
}

function mapChunkRow(row: Record<string, unknown>): RetrievalChunk {
  return retrievalChunkSchema.parse({
    canonicalFactTypeIds: Array.isArray(row.canonical_fact_type_ids)
      ? row.canonical_fact_type_ids
      : [],
    citations: row.citations,
    content: row.content,
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    documentId: row.document_id,
    embedding: Array.isArray(row.embedding) ? row.embedding.map(Number) : [],
    embeddingDimensions: fromPostgresNumber(
      row.embedding_dimensions as number | string | null | undefined,
    ),
    embeddingModel: row.embedding_model,
    entityId: row.entity_id,
    entityType: row.entity_type,
    id: row.id,
    orgId: row.org_id,
    sourceKind: row.source_kind,
    updatedAt: fromPostgresTimestamp(row.updated_at as Date | string),
    version: row.version,
  });
}
