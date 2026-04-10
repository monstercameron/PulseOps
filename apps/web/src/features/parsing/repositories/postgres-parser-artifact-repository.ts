import { type Pool } from "pg";

import {
  parserArtifactSchema,
  type ParserArtifact,
} from "@/features/parsing/domain/parser-artifact";
import { type ParserArtifactRepository } from "@/features/parsing/repositories/parser-artifact-repository";
import {
  fromPostgresNumber,
  fromPostgresTimestamp,
  mapPostgresRows,
  toPostgresJson,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresParserArtifactRepositoryInput = {
  pool: Pool;
};

export function createPostgresParserArtifactRepository({
  pool,
}: CreatePostgresParserArtifactRepositoryInput): ParserArtifactRepository {
  return {
    async getById(id) {
      const result = await pool.query(
        `
          select *
          from parser_artifacts
          where id = $1
        `,
        [id],
      );

      return result.rows[0] === undefined
        ? null
        : mapParserArtifactRow(result.rows[0]);
    },
    async listByDocumentId(documentId) {
      const result = await pool.query(
        `
          select *
          from parser_artifacts
          where document_id = $1
          order by created_at asc
        `,
        [documentId],
      );

      return mapPostgresRows(result.rows, mapParserArtifactRow);
    },
    async put(parserArtifact) {
      const parsedArtifact = parserArtifactSchema.parse(parserArtifact);

      await pool.query(
        `
          insert into parser_artifacts (
            id,
            document_id,
            parser_kind,
            sheet_count,
            sheets,
            total_row_count,
            confidence_score,
            created_at
          ) values (
            $1, $2, $3, $4, $5::jsonb, $6, $7, $8
          )
          on conflict (id) do update set
            document_id = excluded.document_id,
            parser_kind = excluded.parser_kind,
            sheet_count = excluded.sheet_count,
            sheets = excluded.sheets,
            total_row_count = excluded.total_row_count,
            confidence_score = excluded.confidence_score,
            created_at = excluded.created_at
        `,
        [
          parsedArtifact.id,
          parsedArtifact.documentId,
          parsedArtifact.parserKind,
          parsedArtifact.sheetCount,
          toPostgresJson(parsedArtifact.sheets),
          parsedArtifact.totalRowCount,
          parsedArtifact.confidenceScore,
          parsedArtifact.createdAt,
        ],
      );

      return parsedArtifact;
    },
  };
}

function mapParserArtifactRow(row: Record<string, unknown>): ParserArtifact {
  return parserArtifactSchema.parse({
    confidenceScore: fromPostgresNumber(
      row.confidence_score as number | string | null | undefined,
    ),
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    documentId: row.document_id,
    id: row.id,
    parserKind: row.parser_kind,
    sheetCount: fromPostgresNumber(
      row.sheet_count as number | string | null | undefined,
    ),
    sheets: row.sheets,
    totalRowCount: fromPostgresNumber(
      row.total_row_count as number | string | null | undefined,
    ),
  });
}
