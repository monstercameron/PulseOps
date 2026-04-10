"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { type UiMessages } from "@/features/i18n/constants/default-ui-translation-bundles";
import { writeCachedUiMessages } from "@/features/i18n/lib/client-locale-cache";
import {
  resolveTranslatedBranch,
  translateMessage,
} from "@/features/i18n/lib/messages";

type UiI18nContextValue = Readonly<{
  locale: string;
  messages: UiMessages;
  setLocaleMessages: (locale: string, messages: UiMessages) => void;
}>;

type ClientLocaleOverride = Readonly<{
  locale: string;
  messages: UiMessages;
}>;

const UiI18nContext = createContext<UiI18nContextValue | null>(null);

type UiI18nProviderProps = Readonly<{
  children: ReactNode;
  locale: string;
  messages: UiMessages;
}>;

export function UiI18nProvider({
  children,
  locale,
  messages,
}: UiI18nProviderProps) {
  const [clientOverride, setClientOverride] = useState<ClientLocaleOverride | null>(
    null,
  );
  const activeBundle =
    clientOverride === null || clientOverride.locale === locale
      ? {
          locale,
          messages,
        }
      : clientOverride;

  useEffect(() => {
    writeCachedUiMessages(locale, messages);
  }, [locale, messages]);

  return (
    <UiI18nContext.Provider
      value={{
        locale: activeBundle.locale,
        messages: activeBundle.messages,
        setLocaleMessages(nextLocale, nextMessages) {
          setClientOverride({
            locale: nextLocale,
            messages: nextMessages,
          });
          writeCachedUiMessages(nextLocale, nextMessages);
        },
      }}
    >
      {children}
    </UiI18nContext.Provider>
  );
}

export function useUiI18n() {
  const context = useContext(UiI18nContext);

  if (context === null) {
    throw new Error("useUiI18n must be used within UiI18nProvider.");
  }

  return {
    locale: context.locale,
    messages: context.messages,
    setLocaleMessages: context.setLocaleMessages,
    resolveTree<T>(key: string, defaults: T) {
      return resolveTranslatedBranch(context.messages, key, defaults);
    },
    t(
      key: string,
      fallback: string,
      values?: Readonly<Record<string, boolean | number | string>>,
    ) {
      return translateMessage(context.messages, key, fallback, values);
    },
  };
}
