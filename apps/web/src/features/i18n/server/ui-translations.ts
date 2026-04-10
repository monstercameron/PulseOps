import { cookies } from "next/headers";

import {
  defaultUiTranslationBundles,
  type UiMessages,
} from "@/features/i18n/constants/default-ui-translation-bundles";
import {
  DEFAULT_UI_LOCALE,
  UI_LOCALE_COOKIE_NAME,
  UI_TRANSLATION_NAMESPACE,
  resolveUiLocale,
  type SupportedUiLocale,
} from "@/features/i18n/lib/locale";
import {
  resolveTranslatedBranch,
  resolveTranslatedValue,
  translateMessage,
} from "@/features/i18n/lib/messages";
import { localIngestionRuntime } from "@/features/runtime/local-ingestion-runtime";
import { seedUiTranslationBundles } from "@/features/i18n/server/seed-ui-translation-bundles";

const serverUiMessagesCache = new Map<SupportedUiLocale, UiMessages>();
let seedGlobalUiTranslationsPromise: Promise<void> | null = null;

async function seedGlobalUiTranslations() {
  if (seedGlobalUiTranslationsPromise !== null) {
    return seedGlobalUiTranslationsPromise;
  }

  seedGlobalUiTranslationsPromise = (async () => {
    await seedUiTranslationBundles({
      repository: localIngestionRuntime.uiTranslationBundleRepository,
    });
  })();

  return seedGlobalUiTranslationsPromise;
}

async function loadUiMessages(locale: SupportedUiLocale): Promise<UiMessages> {
  const cachedMessages = serverUiMessagesCache.get(locale);

  if (cachedMessages !== undefined) {
    return cachedMessages;
  }

  await seedGlobalUiTranslations();

  const repository = localIngestionRuntime.uiTranslationBundleRepository;

  if (repository === undefined) {
    const fallbackMessages = defaultUiTranslationBundles[locale];
    serverUiMessagesCache.set(locale, fallbackMessages);
    return fallbackMessages;
  }
 
  const translationBundle = await repository.getByLocaleAndNamespace({
    locale,
    namespace: UI_TRANSLATION_NAMESPACE,
    orgId: null,
  });
  const messages = resolveTranslatedValue(
    defaultUiTranslationBundles[locale],
    translationBundle?.messages,
  );

  serverUiMessagesCache.set(locale, messages);

  return messages;
}

export async function getCurrentUiLocale() {
  const cookieStore = await cookies();

  return resolveUiLocale(cookieStore.get(UI_LOCALE_COOKIE_NAME)?.value);
}

export async function getCurrentUiMessages() {
  return loadUiMessages(await getCurrentUiLocale());
}

export async function getUiMessagesForLocale(locale?: string | null) {
  return loadUiMessages(resolveUiLocale(locale));
}

export async function getServerUiTranslator(locale?: string | null) {
  const resolvedLocale = resolveUiLocale(locale ?? (await getCurrentUiLocale()));
  const messages = await loadUiMessages(resolvedLocale);

  return {
    locale: resolvedLocale,
    messages,
    resolveTree<T>(key: string, defaults: T) {
      return resolveTranslatedBranch(messages, key, defaults);
    },
    t(
      key: string,
      fallback: string,
      values?: Readonly<Record<string, boolean | number | string>>,
    ) {
      return translateMessage(messages, key, fallback, values);
    },
  };
}

export function getDefaultUiLocale() {
  return DEFAULT_UI_LOCALE;
}
