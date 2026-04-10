import { type Pool } from "pg";

import {
  documentSchema,
  type DocumentRecord,
} from "@/features/documents/domain/document";
import { type DocumentRepository } from "@/features/documents/repositories/document-repository";
import {
  fromPostgresNumber,
  fromPostgresTimestamp,
  mapPostgresRows,
  toPostgresJson,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresDocumentRepositoryInput = {
  pool: Pool;
};

export function createPostgresDocumentRepository({
  pool,
}: CreatePostgresDocumentRepositoryInput): DocumentRepository {
  return {
    async findByOrgIdAndChecksum(orgId, checksumSha256) {
      const result = await pool.query(
        `
          select *
          from documents
          where org_id = $1 and checksum_sha256 = $2
          order by updated_at desc
          limit 1
        `,
        [orgId, checksumSha256],
      );

      return result.rows[0] === undefined ? null : mapDocumentRow(result.rows[0]);
    },
    async getById(id) {
      const result = await pool.query(
        `
          select *
          from documents
          where id = $1
        `,
        [id],
      );

      return result.rows[0] === undefined ? null : mapDocumentRow(result.rows[0]);
    },
    async listByOrgId(orgId) {
      const result = await pool.query(
        `
          select *
          from documents
          where org_id = $1
          order by created_at asc
        `,
        [orgId],
      );

      return mapPostgresRows(result.rows, mapDocumentRow);
    },
    async put(document) {
      const parsedDocument = documentSchema.parse(document);

      await pool.query(
        `
          insert into documents (
            id,
            org_id,
            file_name,
            file_extension,
            status,
            source,
            content_type,
            size_bytes,
            checksum_sha256,
            retention_policy_key,
            archive_after_days,
            parser_artifact_id,
            classification_confidence_score,
            suggested_document_family,
            raw_object,
            created_at,
            updated_at
          ) values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16, $17
          )
          on conflict (id) do update set
            org_id = excluded.org_id,
            file_name = excluded.file_name,
            file_extension = excluded.file_extension,
            status = excluded.status,
            source = excluded.source,
            content_type = excluded.content_type,
            size_bytes = excluded.size_bytes,
            checksum_sha256 = excluded.checksum_sha256,
            retention_policy_key = excluded.retention_policy_key,
            archive_after_days = excluded.archive_after_days,
            parser_artifact_id = excluded.parser_artifact_id,
            classification_confidence_score = excluded.classification_confidence_score,
            suggested_document_family = excluded.suggested_document_family,
            raw_object = excluded.raw_object,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at
        `,
        [
          parsedDocument.id,
          parsedDocument.orgId,
          parsedDocument.fileName,
          parsedDocument.fileExtension ?? null,
          parsedDocument.status,
          parsedDocument.source,
          parsedDocument.contentType ?? null,
          parsedDocument.sizeBytes ?? null,
          parsedDocument.checksumSha256 ?? null,
          parsedDocument.retentionPolicyKey ?? null,
          parsedDocument.archiveAfterDays ?? null,
          parsedDocument.parserArtifactId ?? null,
          parsedDocument.classificationConfidenceScore ?? null,
          parsedDocument.suggestedDocumentFamily ?? null,
          parsedDocument.rawObject === undefined
            ? null
            : toPostgresJson(parsedDocument.rawObject),
          parsedDocument.createdAt,
          parsedDocument.updatedAt,
        ],
      );

      return parsedDocument;
    },
  };
}

function mapDocumentRow(row: Record<string, unknown>): DocumentRecord {
  return documentSchema.parse({
    archiveAfterDays: fromPostgresNumber(
      row.archive_after_days as number | string | null | undefined,
    ),
    classificationConfidenceScore:
      fromPostgresNumber(
        row.classification_confidence_score as number | string | null | undefined,
      ) ?? undefined,
    checksumSha256: row.checksum_sha256 ?? undefined,
    contentType: row.content_type ?? undefined,
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    fileExtension: row.file_extension ?? undefined,
    fileName: row.file_name,
    id: row.id,
    orgId: row.org_id,
    parserArtifactId: row.parser_artifact_id ?? undefined,
    rawObject: row.raw_object ?? undefined,
    retentionPolicyKey: row.retention_policy_key ?? undefined,
    sizeBytes: fromPostgresNumber(
      row.size_bytes as number | string | null | undefined,
    ),
    source: row.source,
    status: row.status,
    suggestedDocumentFamily: row.suggested_document_family ?? undefined,
    updatedAt: fromPostgresTimestamp(row.updated_at as Date | string),
  });
}
