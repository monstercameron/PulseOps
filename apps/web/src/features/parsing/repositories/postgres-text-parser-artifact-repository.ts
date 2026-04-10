import { type Pool } from "pg";

import {
  textParserArtifactSchema,
  type TextParserArtifact,
} from "@/features/parsing/domain/text-parser-artifact";
import { type TextParserArtifactRepository } from "@/features/parsing/repositories/text-parser-artifact-repository";
import {
  fromPostgresNumber,
  fromPostgresTimestamp,
  mapPostgresRows,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresTextParserArtifactRepositoryInput = {
  pool: Pool;
};

export function createPostgresTextParserArtifactRepository({
  pool,
}: CreatePostgresTextParserArtifactRepositoryInput): TextParserArtifactRepository {
  return {
    async getById(id) {
      const result = await pool.query(
        `
          select *
          from text_parser_artifacts
          where id = $1
        `,
        [id],
      );

      return result.rows[0] === undefined
        ? null
        : mapTextParserArtifactRow(result.rows[0]);
    },
    async listByDocumentId(documentId) {
      const result = await pool.query(
        `
          select *
          from text_parser_artifacts
          where document_id = $1
          order by created_at asc
        `,
        [documentId],
      );

      return mapPostgresRows(result.rows, mapTextParserArtifactRow);
    },
    async put(textParserArtifact) {
      const parsedArtifact = textParserArtifactSchema.parse(textParserArtifact);

      await pool.query(
        `
          insert into text_parser_artifacts (
            id,
            document_id,
            parser_kind,
            text,
            text_length,
            section_count,
            used_ocr_fallback,
            confidence_score,
            created_at
          ) values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
          )
          on conflict (id) do update set
            document_id = excluded.document_id,
            parser_kind = excluded.parser_kind,
            text = excluded.text,
            text_length = excluded.text_length,
            section_count = excluded.section_count,
            used_ocr_fallback = excluded.used_ocr_fallback,
            confidence_score = excluded.confidence_score,
            created_at = excluded.created_at
        `,
        [
          parsedArtifact.id,
          parsedArtifact.documentId,
          parsedArtifact.parserKind,
          parsedArtifact.text,
          parsedArtifact.textLength,
          parsedArtifact.sectionCount,
          parsedArtifact.usedOcrFallback,
          parsedArtifact.confidenceScore,
          parsedArtifact.createdAt,
        ],
      );

      return parsedArtifact;
    },
  };
}

function mapTextParserArtifactRow(
  row: Record<string, unknown>,
): TextParserArtifact {
  return textParserArtifactSchema.parse({
    confidenceScore: fromPostgresNumber(
      row.confidence_score as number | string | null | undefined,
    ),
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    documentId: row.document_id,
    id: row.id,
    parserKind: row.parser_kind,
    sectionCount: fromPostgresNumber(
      row.section_count as number | string | null | undefined,
    ),
    text: row.text,
    textLength: fromPostgresNumber(
      row.text_length as number | string | null | undefined,
    ),
    usedOcrFallback: row.used_ocr_fallback,
  });
}
