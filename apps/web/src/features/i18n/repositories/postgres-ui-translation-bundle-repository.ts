import { type Pool } from "pg";

import {
  uiTranslationBundleRecordSchema,
  type UiTranslationBundleRecord,
} from "@/features/i18n/domain/ui-translation-bundle-record";
import { type UiTranslationBundleRepository } from "@/features/i18n/repositories/ui-translation-bundle-repository";
import {
  fromPostgresTimestamp,
  toPostgresJson,
} from "@/features/persistence/postgres/postgres-pool";

type CreatePostgresUiTranslationBundleRepositoryInput = Readonly<{
  pool: Pool;
}>;

export function createPostgresUiTranslationBundleRepository({
  pool,
}: CreatePostgresUiTranslationBundleRepositoryInput): UiTranslationBundleRepository {
  return {
    async getByLocaleAndNamespace({ locale, namespace, orgId = null }) {
      const result = await pool.query(
        `
          select *
          from ui_translation_bundles
          where locale = $1
            and namespace = $2
            and (
              (org_id is null and $3::text is null)
              or org_id = $3
            )
          order by updated_at desc
          limit 1
        `,
        [locale, namespace, orgId],
      );

      return result.rows[0] === undefined
        ? null
        : mapUiTranslationBundleRow(result.rows[0]);
    },
    async put(translationBundle) {
      const parsedBundle = uiTranslationBundleRecordSchema.parse(translationBundle);

      await pool.query(
        `
          insert into ui_translation_bundles (
            id,
            org_id,
            locale,
            namespace,
            messages,
            created_at,
            updated_at,
            version
          ) values (
            $1, $2, $3, $4, $5::jsonb, $6, $7, $8
          )
          on conflict (id) do update set
            org_id = excluded.org_id,
            locale = excluded.locale,
            namespace = excluded.namespace,
            messages = excluded.messages,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at,
            version = excluded.version
        `,
        [
          parsedBundle.id,
          parsedBundle.orgId,
          parsedBundle.locale,
          parsedBundle.namespace,
          toPostgresJson(parsedBundle.messages),
          parsedBundle.createdAt,
          parsedBundle.updatedAt,
          parsedBundle.version,
        ],
      );

      return parsedBundle;
    },
  };
}

function mapUiTranslationBundleRow(
  row: Record<string, unknown>,
): UiTranslationBundleRecord {
  return uiTranslationBundleRecordSchema.parse({
    createdAt: fromPostgresTimestamp(row.created_at as Date | string),
    id: row.id,
    locale: row.locale,
    messages: row.messages,
    namespace: row.namespace,
    orgId: row.org_id,
    updatedAt: fromPostgresTimestamp(row.updated_at as Date | string),
    version: row.version,
  });
}
