import { cookies } from "next/headers";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { UiI18nProvider } from "@/features/i18n/components/ui-i18n-provider";
import { getUiLocaleDirection } from "@/features/i18n/lib/locale";
import {
  getCurrentUiLocale,
  getCurrentUiMessages,
} from "@/features/i18n/server/ui-translations";
import { ThemeHydrator } from "@/features/shell/components/theme-hydrator";
import {
  APP_THEME_COOKIE_NAME,
  coerceStoredAppTheme,
} from "@/features/shell/lib/theme-preference";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PulseOps",
  description:
    "Weekly cash and margin intelligence for field-service businesses.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = await getCurrentUiLocale();
  const messages = await getCurrentUiMessages();
  const direction = getUiLocaleDirection(locale);
  const theme =
    coerceStoredAppTheme(cookieStore.get(APP_THEME_COOKIE_NAME)?.value) ?? "light";

  return (
    <html
      dir={direction}
      lang={locale}
      data-theme={theme}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex h-full flex-col">
        <ThemeHydrator />
        <a
          className="sr-only fixed start-4 top-4 z-[100] rounded-md bg-[#0d1b2a] px-3 py-2 text-sm font-semibold text-white focus:not-sr-only"
          href="#main-content"
        >
          {messages.common.skipToMainContent}
        </a>
        <UiI18nProvider locale={locale} messages={messages}>
          {children}
        </UiI18nProvider>
      </body>
    </html>
  );
}
