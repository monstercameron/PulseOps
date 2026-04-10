"use client";

import { useEffect } from "react";

import { getDefaultUiMessages } from "@/features/i18n/constants/default-ui-translation-bundles";
import { readCachedUiMessages } from "@/features/i18n/lib/client-locale-cache";
import { resolveUiLocale } from "@/features/i18n/lib/locale";
import { reportClientErrorBoundary } from "@/features/observability/lib/client-error-boundary-report";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = resolveUiLocale(
    typeof document === "undefined" ? undefined : document.documentElement.lang,
  );
  const messages = readCachedUiMessages(locale) ?? getDefaultUiMessages(locale);

  useEffect(() => {
    reportClientErrorBoundary({
      boundary: "app",
      error,
    });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-6">
      <div className="w-full max-w-lg rounded-3xl border border-[rgba(20,34,53,0.08)] bg-white p-8 shadow-[0_20px_60px_rgba(20,34,53,0.12)]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">
          {messages.appError.badge}
        </p>
        <h1 className="mt-3 text-[28px] font-semibold tracking-tight text-foreground">
          {messages.appError.title}
        </h1>
        <p className="mt-3 text-[14px] leading-7 text-muted">
          {messages.appError.description}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-[#123d2f] px-4 py-2 text-[13px] font-semibold text-[#f3efe6]"
          >
            {messages.appError.tryAgain}
          </button>
          <button
            type="button"
            onClick={() => window.location.assign("/dashboard")}
            className="rounded-full border border-[rgba(20,34,53,0.12)] px-4 py-2 text-[13px] font-semibold text-foreground"
          >
            {messages.appError.goToDashboard}
          </button>
        </div>
      </div>
    </main>
  );
}
