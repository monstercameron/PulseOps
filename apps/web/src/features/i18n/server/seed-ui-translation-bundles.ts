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
      updatedLocales: [] as string[],
    };
  }

  const insertedLocales: string[] = [];
  const skippedLocales: string[] = [];
  const updatedLocales: string[] = [];
  const timestamp = now();

  for (const [locale, messages] of Object.entries(defaultUiTranslationBundles)) {
    const existingBundle = await repository.getByLocaleAndNamespace({
      locale,
      namespace: UI_TRANSLATION_NAMESPACE,
      orgId: null,
    });

    if (existingBundle === null) {
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
      continue;
    }

    const mergedMessages = backfillMissingMessageKeys(
      messages,
      existingBundle.messages,
    );

    if (JSON.stringify(mergedMessages) === JSON.stringify(existingBundle.messages)) {
      skippedLocales.push(locale);
      continue;
    }

    await repository.put({
      ...existingBundle,
      messages: mergedMessages,
      updatedAt: timestamp,
    });
    updatedLocales.push(locale);
  }

  return {
    insertedLocales,
    skippedLocales,
    updatedLocales,
  };
}

function backfillMissingMessageKeys<T>(defaults: T, existing: unknown): T {
  if (
    typeof defaults === "string" ||
    typeof defaults === "number" ||
    typeof defaults === "boolean" ||
    defaults === null
  ) {
    return (existing ?? defaults) as T;
  }

  if (Array.isArray(defaults)) {
    const existingArray = Array.isArray(existing) ? existing : [];
    const mergedDefaults = defaults.map((value, index) =>
      backfillMissingMessageKeys(value, existingArray[index]),
    );

    return [...mergedDefaults, ...existingArray.slice(defaults.length)] as T;
  }

  if (isMessageObject(defaults)) {
    const existingObject = isMessageObject(existing) ? existing : {};
    const mergedObject = Object.fromEntries(
      Object.entries(defaults).map(([key, value]) => [
        key,
        backfillMissingMessageKeys(value, existingObject[key]),
      ]),
    ) as Record<string, unknown>;

    for (const [key, value] of Object.entries(existingObject)) {
      if (!(key in mergedObject)) {
        mergedObject[key] = value;
      }
    }

    return mergedObject as T;
  }

  return defaults;
}

function isMessageObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
