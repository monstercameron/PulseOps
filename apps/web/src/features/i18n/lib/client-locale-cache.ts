import { type UiMessages } from "@/features/i18n/constants/default-ui-translation-bundles";
import { resolveUiLocale } from "@/features/i18n/lib/locale";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

const UI_MESSAGES_CACHE_KEY_PREFIX = "pulseops-ui-messages";
const inMemoryUiMessagesCache = new Map<string, UiMessages>();

export function getUiMessagesCacheKey(locale: string) {
  return `${UI_MESSAGES_CACHE_KEY_PREFIX}:${resolveUiLocale(locale)}`;
}

export function readCachedUiMessages(
  locale: string,
  storage: StorageLike | null = getBrowserStorage(),
) {
  const resolvedLocale = resolveUiLocale(locale);
  const inMemoryMessages = inMemoryUiMessagesCache.get(resolvedLocale);

  if (inMemoryMessages !== undefined) {
    return inMemoryMessages;
  }

  const serializedMessages = storage?.getItem(getUiMessagesCacheKey(resolvedLocale));

  if (serializedMessages === null || serializedMessages === undefined) {
    return null;
  }

  try {
    const messages = JSON.parse(serializedMessages) as UiMessages;
    inMemoryUiMessagesCache.set(resolvedLocale, messages);
    return messages;
  } catch {
    return null;
  }
}

export function writeCachedUiMessages(
  locale: string,
  messages: UiMessages,
  storage: StorageLike | null = getBrowserStorage(),
) {
  const resolvedLocale = resolveUiLocale(locale);
  inMemoryUiMessagesCache.set(resolvedLocale, messages);
  storage?.setItem(getUiMessagesCacheKey(resolvedLocale), JSON.stringify(messages));
}

function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

