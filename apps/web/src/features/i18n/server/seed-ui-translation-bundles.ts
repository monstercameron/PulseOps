import {
  defaultUiTranslationBundles,
} from "@/features/i18n/constants/default-ui-translation-bundles";
import { UI_TRANSLATION_NAMESPACE } from "@/features/i18n/lib/locale";
import { type UiTranslationBundleRepository } from "@/features/i18n/repositories/ui-translation-bundle-repository";

type SeedUiTranslationBundlesInput = Readonly<{
  now?: () => string;
  repository?: UiTranslationBundleRepository;
}>;

export async function seedUiTranslationBundles({
  now = () => new Date().toISOString(),
  repository,
}: SeedUiTranslationBundlesInput = {}) {
  if (repository === undefined) {
    return {
      insertedLocales: [] as string[],
      skippedLocales: Object.keys(defaultUiTranslationBundles),
    };
  }

  const insertedLocales: string[] = [];
  const skippedLocales: string[] = [];
  const timestamp = now();

  for (const [locale, messages] of Object.entries(defaultUiTranslationBundles)) {
    const existingBundle = await repository.getByLocaleAndNamespace({
      locale,
      namespace: UI_TRANSLATION_NAMESPACE,
      orgId: null,
    });

    if (existingBundle !== null) {
      skippedLocales.push(locale);
      continue;
    }

    await repository.put({
      createdAt: timestamp,
      id: `global:${locale}:${UI_TRANSLATION_NAMESPACE}`,
      locale,
      messages,
      namespace: UI_TRANSLATION_NAMESPACE,
      orgId: null,
      updatedAt: timestamp,
      version: "ui-translation-bundle.v1",
    });
    insertedLocales.push(locale);
  }

  return {
    insertedLocales,
    skippedLocales,
  };
}
