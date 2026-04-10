import { describe, expect, it } from "vitest";

import {
  getUiMessagesCacheKey,
  readCachedUiMessages,
  writeCachedUiMessages,
} from "@/features/i18n/lib/client-locale-cache";
import { defaultUiTranslationBundles } from "@/features/i18n/constants/default-ui-translation-bundles";

function createMemoryStorage() {
  const store = new Map<string, string>();

  return {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe("client locale cache", () => {
  it("stores and reads locale bundles from local storage semantics", () => {
    const storage = createMemoryStorage();
    const messages = defaultUiTranslationBundles["en-US"];

    writeCachedUiMessages("en-US", messages, storage);

    expect(getUiMessagesCacheKey("en_US")).toBe("pulseops-ui-messages:en-US");
    expect(readCachedUiMessages("en-US", storage)).toEqual(messages);
  });

  it("returns null for invalid cached payloads", () => {
    const storage = createMemoryStorage();

    storage.setItem(getUiMessagesCacheKey("en-GB"), "{");

    expect(readCachedUiMessages("en-GB", storage)).toBeNull();
  });
});
