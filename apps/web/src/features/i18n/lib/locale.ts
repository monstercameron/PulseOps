export const DEFAULT_UI_LOCALE = "en-US";
export const UI_TRANSLATION_NAMESPACE = "ui";
export const UI_LOCALE_COOKIE_NAME = "pulseops-locale";

export const supportedUiLocales = [
  {
    code: "en-US",
    label: "English (US)",
    shortLabel: "ENG",
  },
  {
    code: "en-GB",
    label: "English (UK)",
    shortLabel: "ENG",
  },
  {
    code: "es-MX",
    label: "Espanol (Mexico)",
    shortLabel: "ESP",
  },
  {
    code: "es-ES",
    label: "Espanol (Espana)",
    shortLabel: "ESP",
  },
] as const;

export type SupportedUiLocale = (typeof supportedUiLocales)[number]["code"];

const supportedUiLocaleSet = new Set(
  supportedUiLocales.map((locale) => locale.code.toLowerCase()),
);

export function resolveUiLocale(locale?: string | null): SupportedUiLocale {
  if (!locale) {
    return DEFAULT_UI_LOCALE;
  }

  const normalizedLocale = locale.trim().replaceAll("_", "-").toLowerCase();

  for (const supportedLocale of supportedUiLocales) {
    if (supportedLocale.code.toLowerCase() === normalizedLocale) {
      return supportedLocale.code;
    }
  }

  const baseLanguage = normalizedLocale.split("-")[0];

  for (const supportedLocale of supportedUiLocales) {
    if (supportedLocale.code.toLowerCase().split("-")[0] === baseLanguage) {
      return supportedLocale.code;
    }
  }

  return DEFAULT_UI_LOCALE;
}

export function getUiLocaleDirection(locale: string) {
  const rtlLanguages = new Set(["ar", "fa", "he", "ur"]);
  const baseLanguage = locale.toLowerCase().split("-")[0];

  return rtlLanguages.has(baseLanguage) ? "rtl" : "ltr";
}

export function isSupportedUiLocale(locale: string): locale is SupportedUiLocale {
  return supportedUiLocaleSet.has(locale.toLowerCase());
}
