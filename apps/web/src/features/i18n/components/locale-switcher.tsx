"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { cx } from "@/features/catalog/components/catalog-primitives";
import { type UiMessages } from "@/features/i18n/constants/default-ui-translation-bundles";
import { useUiI18n } from "@/features/i18n/components/ui-i18n-provider";
import { readCachedUiMessages } from "@/features/i18n/lib/client-locale-cache";
import { supportedUiLocales } from "@/features/i18n/lib/locale";

type LocaleSwitcherProps = Readonly<{
  className?: string;
  tone?: "dark" | "light";
}>;

const toneClasses = {
  dark:
    "border-white/[0.14] bg-white/[0.04] text-white/85 hover:border-white/[0.24] focus-visible:ring-white/40",
  light:
    "border-border bg-card text-foreground hover:border-foreground/15 focus-visible:ring-accent/40",
} as const;

export function LocaleSwitcher({
  className,
  tone = "light",
}: LocaleSwitcherProps) {
  const { locale, setLocaleMessages, t } = useUiI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function updateLocale(nextLocale: string) {
    if (nextLocale === locale) {
      return;
    }

    const cachedMessages = readCachedUiMessages(nextLocale);

    if (cachedMessages !== null) {
      setLocaleMessages(nextLocale, cachedMessages);
    } else {
      const messagesResponse = await fetch(
        `/api/i18n/messages?locale=${encodeURIComponent(nextLocale)}`,
      );
      const messagesPayload = (await messagesResponse.json()) as Readonly<{
        locale: string;
        messages: UiMessages;
      }>;

      if (messagesResponse.ok) {
        setLocaleMessages(messagesPayload.locale, messagesPayload.messages);
      }
    }

    await fetch("/api/i18n/locale", {
      body: JSON.stringify({ locale: nextLocale }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <label className={cx("inline-flex items-center gap-2", className)}>
      <span className="sr-only">{t("common.localeLabel", "Locale")}</span>
      <select
        className={cx(
          "min-h-[26px] rounded-[6px] border px-2 py-[3px] text-[11.5px] font-medium transition focus-visible:outline-none focus-visible:ring-2",
          toneClasses[tone],
          isPending ? "cursor-wait opacity-70" : "cursor-pointer",
        )}
        disabled={isPending}
        onChange={(event) => {
          void updateLocale(event.target.value);
        }}
        value={locale}
      >
        {supportedUiLocales.map((supportedLocale) => (
          <option key={supportedLocale.code} value={supportedLocale.code}>
            {supportedLocale.shortLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
