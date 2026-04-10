import { describe, expect, test } from "vitest";

import {
  DEFAULT_UI_LOCALE,
  getUiLocaleDirection,
  resolveUiLocale,
} from "@/features/i18n/lib/locale";

describe("locale helpers", () => {
  test("falls back to the default locale for unsupported input", () => {
    expect(resolveUiLocale("fr-FR")).toBe(DEFAULT_UI_LOCALE);
    expect(resolveUiLocale(undefined)).toBe(DEFAULT_UI_LOCALE);
  });

  test("normalizes supported locales and resolves text direction", () => {
    expect(resolveUiLocale("en_gb")).toBe("en-GB");
    expect(resolveUiLocale("es_mx")).toBe("es-MX");
    expect(resolveUiLocale("es")).toBe("es-MX");
    expect(getUiLocaleDirection("en-GB")).toBe("ltr");
    expect(getUiLocaleDirection("ar-SA")).toBe("rtl");
  });
});
