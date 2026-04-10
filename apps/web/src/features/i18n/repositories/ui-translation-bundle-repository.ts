import { type UiTranslationBundleRecord } from "@/features/i18n/domain/ui-translation-bundle-record";

export interface UiTranslationBundleRepository {
  getByLocaleAndNamespace(input: Readonly<{
    locale: string;
    namespace: string;
    orgId?: string | null;
  }>): Promise<UiTranslationBundleRecord | null>;
  put(
    translationBundle: UiTranslationBundleRecord,
  ): Promise<UiTranslationBundleRecord>;
}
