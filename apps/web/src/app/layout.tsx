import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { UiI18nProvider } from "@/features/i18n/components/ui-i18n-provider";
import { getUiLocaleDirection } from "@/features/i18n/lib/locale";
import {
  getCurrentUiLocale,
  getCurrentUiMessages,
} from "@/features/i18n/server/ui-translations";
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
  const locale = await getCurrentUiLocale();
  const messages = await getCurrentUiMessages();
  const direction = getUiLocaleDirection(locale);

  return (
    <html
      dir={direction}
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.setAttribute('data-theme',localStorage.getItem('pulseops-theme')||'light');",
          }}
        />
      </head>
      <body className="flex h-full flex-col">
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
