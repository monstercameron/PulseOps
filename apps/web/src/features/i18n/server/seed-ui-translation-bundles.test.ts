import { describe, expect, test } from "vitest";

import { defaultUiTranslationBundles } from "@/features/i18n/constants/default-ui-translation-bundles";
import { type UiMessages } from "@/features/i18n/constants/default-ui-translation-bundles";
import { UI_TRANSLATION_NAMESPACE } from "@/features/i18n/lib/locale";
import {
  seedUiTranslationBundles,
} from "@/features/i18n/server/seed-ui-translation-bundles";
import { type UiTranslationBundleRecord } from "@/features/i18n/domain/ui-translation-bundle-record";
import { type UiTranslationBundleRepository } from "@/features/i18n/repositories/ui-translation-bundle-repository";

function createRepository() {
  const bundles = new Map<string, UiTranslationBundleRecord>();

  const repository: UiTranslationBundleRepository = {
    async getByLocaleAndNamespace(input) {
      return bundles.get(`${input.orgId ?? "global"}:${input.locale}:${input.namespace}`) ?? null;
    },
    async put(bundle) {
      bundles.set(`${bundle.orgId ?? "global"}:${bundle.locale}:${bundle.namespace}`, bundle);
      return bundle;
    },
  };

  return { bundles, repository };
}

describe("seedUiTranslationBundles", () => {
  test("inserts default locale bundles into the repository", async () => {
    const { bundles, repository } = createRepository();

    const result = await seedUiTranslationBundles({
      now: () => "2026-04-10T12:00:00.000Z",
      repository,
    });

    expect(result.insertedLocales).toEqual(Object.keys(defaultUiTranslationBundles));
    expect(result.skippedLocales).toEqual([]);
    expect(bundles.size).toBe(Object.keys(defaultUiTranslationBundles).length);
    const englishMessages = bundles.get(`global:en-US:${UI_TRANSLATION_NAMESPACE}`)
      ?.messages as UiMessages | undefined;
    const spanishMessages = bundles.get(`global:es-MX:${UI_TRANSLATION_NAMESPACE}`)
      ?.messages as UiMessages | undefined;

    expect(englishMessages?.common.localeLabel).toBe("Locale");
    expect(spanishMessages?.common.localeLabel).toBe("Idioma");
  });

  test("skips locales that already exist", async () => {
    const { repository } = createRepository();

    await repository.put({
      createdAt: "2026-04-09T00:00:00.000Z",
      id: `global:en-US:${UI_TRANSLATION_NAMESPACE}`,
      locale: "en-US",
      messages: defaultUiTranslationBundles["en-US"],
      namespace: UI_TRANSLATION_NAMESPACE,
      orgId: null,
      updatedAt: "2026-04-09T00:00:00.000Z",
      version: "ui-translation-bundle.v1",
    });

    const result = await seedUiTranslationBundles({
      now: () => "2026-04-10T12:00:00.000Z",
      repository,
    });

    expect(result.skippedLocales).toContain("en-US");
    expect(result.insertedLocales).not.toContain("en-US");
    expect(result.insertedLocales.length).toBe(
      Object.keys(defaultUiTranslationBundles).length - 1,
    );
  });
});
