import { type Pool } from "pg";

import {
  memoryEmbeddingSchema,
  type MemoryEmbedding,
} from "@/features/chunks/domain/memory-embedding";
import { type MemoryEmbeddingRepository } from "@/features/chunks/repositories/memory-embedding-repository";
import {
  fromPostgresNumber,
  fromPostgresTimestamp,
  mapPostgresRows,
  toPostgresJson,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresMemoryEmbeddingRepositoryInput = Readonly<{
  pool: Pool;
}>;

export function createPostgresMemoryEmbeddingRepository({
  pool,
}: CreatePostgresMemoryEmbeddingRepositoryInput): MemoryEmbeddingRepository {
  return {
    async listByOrgId(orgId) {
      const result = await pool.query(
        `
          select *
          from memory_embeddings
          where org_id = $1
          order by created_at asc
        `,
        [orgId],
      );

      return mapPostgresRows(result.rows, mapMemoryEmbeddingRow);
    },
    async listBySourceId(sourceId) {
      const result = await pool.query(
        `
          select *
          from memory_embeddings
          where source_id = $1
          order by created_at asc
        `,
        [sourceId],
      );

      return mapPostgresRows(result.rows, mapMemoryEmbeddingRow);
    },
    async put(memoryEmbedding) {
      const parsedMemoryEmbedding =
        memoryEmbeddingSchema.parse(memoryEmbedding);

      await pool.query(
        `
          insert into memory_embeddings (
            id,
            org_id,
            memory_kind,
            source_id,
            content,
            metadata,
            embedding_model,
            embedding,
            embedding_dimensions,
            created_at,
            updated_at,
            version
          ) values (
            $1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12
          )
          on conflict (id) do update set
            org_id = excluded.org_id,
            memory_kind = excluded.memory_kind,
            source_id = excluded.source_id,
            content = excluded.content,
            metadata = excluded.metadata,
            embedding_model = excluded.embedding_model,
            embedding = excluded.embedding,
            embedding_dimensions = excluded.embedding_dimensions,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at,
            version = excluded.version
        `,
        [
          parsedMemoryEmbedding.id,
          parsedMemoryEmbedding.orgId,
          parsedMemoryEmbedding.memoryKind,
          parsedMemoryEmbedding.sourceId,
          parsedMemoryEmbedding.content,
          toPostgresJson(parsedMemoryEmbedding.metadata),
          parsedMemoryEmbedding.embeddingModel,
          parsedMemoryEmbedding.embedding,
          parsedMemoryEmbedding.embeddingDimensions,
          parsedMemoryEmbedding.createdAt,
          parsedMemoryEmbedding.updatedAt,
          parsedMemoryEmbedding.version,
        ],
      );

      return parsedMemoryEmbedding;
    },
  };
}

function mapMemoryEmbeddingRow(row: Record<string, unknown>): MemoryEmbedding {
  return memoryEmbeddingSchema.parse({
    content: row.content,
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    embedding: row.embedding,
    embeddingDimensions: fromPostgresNumber(
      row.embedding_dimensions as number | string | null | undefined,
    ),
    embeddingModel: row.embedding_model,
    id: row.id,
    memoryKind: row.memory_kind,
    metadata: row.metadata,
    orgId: row.org_id,
    sourceId: row.source_id,
    updatedAt: fromPostgresTimestamp(row.updated_at as Date | string),
    version: row.version,
  });
}
