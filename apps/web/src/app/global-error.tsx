"use client";

import { useEffect } from "react";

import { DEFAULT_UI_LOCALE } from "@/features/i18n/lib/locale";
import { reportClientErrorBoundary } from "@/features/observability/lib/client-error-boundary-report";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientErrorBoundary({
      boundary: "global",
      error,
    });
  }, [error]);

  return (
    <html lang={DEFAULT_UI_LOCALE}>
      <body className="min-h-screen bg-[#f5f7fb]">
        <main className="flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-lg rounded-3xl border border-[rgba(20,34,53,0.08)] bg-white p-8 shadow-[0_20px_60px_rgba(20,34,53,0.12)]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">
              Global error
            </p>
            <h1 className="mt-3 text-[28px] font-semibold tracking-tight text-foreground">
              The app hit a fatal error.
            </h1>
            <p className="mt-3 text-[14px] leading-7 text-muted">
              The failure was reported through the structured logging path.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={reset}
                className="rounded-full bg-[#123d2f] px-4 py-2 text-[13px] font-semibold text-[#f3efe6]"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-full border border-[rgba(20,34,53,0.12)] px-4 py-2 text-[13px] font-semibold text-foreground"
              >
                Reload page
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
