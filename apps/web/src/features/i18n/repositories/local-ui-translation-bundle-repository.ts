import path from "node:path";

import { createLocalJsonCollection } from "@/features/persistence/lib/local-json-collection";
import {
  uiTranslationBundleRecordSchema,
  type UiTranslationBundleRecord,
} from "@/features/i18n/domain/ui-translation-bundle-record";
import { type UiTranslationBundleRepository } from "@/features/i18n/repositories/ui-translation-bundle-repository";

type CreateLocalUiTranslationBundleRepositoryInput = Readonly<{
  rootDirectory: string;
}>;

export function createLocalUiTranslationBundleRepository({
  rootDirectory,
}: CreateLocalUiTranslationBundleRepositoryInput): UiTranslationBundleRepository {
  const collection = createLocalJsonCollection({
    filePath: path.join(rootDirectory, "ui-translation-bundles.json"),
    recordSchema: uiTranslationBundleRecordSchema,
  });

  return {
    async getByLocaleAndNamespace({ locale, namespace, orgId = null }) {
      const bundles = await collection.list();

      return (
        bundles.find(
          (bundle) =>
            bundle.locale === locale &&
            bundle.namespace === namespace &&
            bundle.orgId === orgId,
        ) ?? null
      );
    },
    async put(translationBundle) {
      return collection.put(
        uiTranslationBundleRecordSchema.parse(translationBundle),
      );
    },
  };
}

export type { UiTranslationBundleRecord };
