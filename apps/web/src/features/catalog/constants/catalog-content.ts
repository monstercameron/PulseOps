import { catalogContentEnUs } from "@/features/catalog/constants/catalog-content.en";
import { catalogContentEsEs } from "@/features/catalog/constants/catalog-content.es";
import type {
  CatalogContent,
  CatalogInventoryRow,
  CatalogRecordRow,
} from "@/features/catalog/constants/catalog-content.shared";

const catalogContentByLocale: Readonly<Record<string, CatalogContent>> = {
  "en-US": catalogContentEnUs,
  "es-ES": catalogContentEsEs,
};

export type { CatalogContent, CatalogInventoryRow, CatalogRecordRow };

export const DEFAULT_CATALOG_LOCALE = "en-US";

export function resolveCatalogLocale(locale?: string) {
  if (!locale) {
    return DEFAULT_CATALOG_LOCALE;
  }

  const normalizedLocale = locale.trim().replaceAll("_", "-").toLowerCase();
  const supportedLocales = Object.keys(catalogContentByLocale);
  const exactMatch = supportedLocales.find(
    (candidateLocale) => candidateLocale.toLowerCase() === normalizedLocale,
  );

  if (exactMatch) {
    return exactMatch;
  }

  const baseLanguage = normalizedLocale.split("-")[0];
  const baseMatch = supportedLocales.find(
    (candidateLocale) =>
      candidateLocale.toLowerCase().split("-")[0] === baseLanguage,
  );

  return baseMatch ?? DEFAULT_CATALOG_LOCALE;
}

export function getCatalogTextDirection(locale: string) {
  const rtlLanguages = new Set(["ar", "fa", "he", "ur"]);
  const baseLanguage = locale.toLowerCase().split("-")[0];

  return rtlLanguages.has(baseLanguage) ? "rtl" : "ltr";
}

export function getCatalogContent(locale?: string) {
  return catalogContentByLocale[resolveCatalogLocale(locale)];
}
