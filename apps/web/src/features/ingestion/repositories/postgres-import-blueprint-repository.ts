import { type Pool } from "pg";

import {
  importBlueprintSchema,
  type ImportBlueprint,
} from "@/features/ingestion/domain/import-blueprint";
import { type ImportBlueprintRepository } from "@/features/ingestion/repositories/import-blueprint-repository";
import {
  fromPostgresTimestamp,
  mapPostgresRows,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresImportBlueprintRepositoryInput = Readonly<{
  pool: Pool;
}>;

export function createPostgresImportBlueprintRepository({
  pool,
}: CreatePostgresImportBlueprintRepositoryInput): ImportBlueprintRepository {
  return {
    async getById(id) {
      const result = await pool.query(
        `
          select *
          from import_blueprints
          where id = $1
        `,
        [id],
      );

      return result.rows[0] === undefined
        ? null
        : mapImportBlueprintRow(result.rows[0]);
    },
    async listByOrgId(orgId) {
      const result = await pool.query(
        `
          select *
          from import_blueprints
          where org_id = $1
          order by updated_at desc
        `,
        [orgId],
      );

      return mapPostgresRows(result.rows, mapImportBlueprintRow);
    },
    async put(importBlueprint) {
      const parsedImportBlueprint =
        importBlueprintSchema.parse(importBlueprint);

      await pool.query(
        `
          insert into import_blueprints (
            id,
            org_id,
            source_kind,
            name,
            target_document_family,
            parser_route,
            status,
            policy_id,
            example_file_names,
            created_at,
            updated_at,
            version
          ) values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
          )
          on conflict (id) do update set
            org_id = excluded.org_id,
            source_kind = excluded.source_kind,
            name = excluded.name,
            target_document_family = excluded.target_document_family,
            parser_route = excluded.parser_route,
            status = excluded.status,
            policy_id = excluded.policy_id,
            example_file_names = excluded.example_file_names,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at,
            version = excluded.version
        `,
        [
          parsedImportBlueprint.id,
          parsedImportBlueprint.orgId,
          parsedImportBlueprint.sourceKind,
          parsedImportBlueprint.name,
          parsedImportBlueprint.targetDocumentFamily,
          parsedImportBlueprint.parserRoute,
          parsedImportBlueprint.status,
          parsedImportBlueprint.policyId ?? null,
          parsedImportBlueprint.exampleFileNames,
          parsedImportBlueprint.createdAt,
          parsedImportBlueprint.updatedAt,
          parsedImportBlueprint.version,
        ],
      );

      return parsedImportBlueprint;
    },
  };
}

function mapImportBlueprintRow(row: Record<string, unknown>): ImportBlueprint {
  return importBlueprintSchema.parse({
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    exampleFileNames: row.example_file_names,
    id: row.id,
    name: row.name,
    orgId: row.org_id,
    parserRoute: row.parser_route,
    policyId: row.policy_id ?? undefined,
    sourceKind: row.source_kind,
    status: row.status,
    targetDocumentFamily: row.target_document_family,
    updatedAt: fromPostgresTimestamp(row.updated_at as Date | string),
    version: row.version,
  });
}
