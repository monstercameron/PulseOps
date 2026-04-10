import { describe, expect, test } from "vitest";

import { defaultUiTranslationBundles } from "@/features/i18n/constants/default-ui-translation-bundles";
import {
  resolveTranslatedBranch,
  translateMessage,
} from "@/features/i18n/lib/messages";

describe("message helpers", () => {
  test("resolves translated branches over default trees", () => {
    const defaults = {
      hero: {
        description: "Default description",
        title: "Default title",
      },
    };
    const messages = {
      marketing: {
        home: {
          hero: {
            title: "Localized title",
          },
        },
      },
    };

    expect(resolveTranslatedBranch(messages, "marketing.home", defaults)).toEqual({
      hero: {
        description: "Default description",
        title: "Localized title",
      },
    });
  });

  test("interpolates message variables with fallback text", () => {
    const messages = {
      dashboardPage: {
        queueItemsLabel: "{{count}} items",
      },
    };

    expect(
      translateMessage(
        messages,
        "dashboardPage.queueItemsLabel",
        "fallback",
        { count: 4 },
      ),
    ).toBe("4 items");
  });

  test("ships seeded spanish bundles", () => {
    expect(defaultUiTranslationBundles["es-MX"].common.localeLabel).toBe("Idioma");
    expect(defaultUiTranslationBundles["es-ES"].appShell.navItems.ask.label).toBe(
      "Preguntar",
    );
  });
});
