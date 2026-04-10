"use client";

type ReportClientErrorBoundaryInput = {
  boundary: "app" | "global";
  error: Error & { digest?: string };
};

declare global {
  interface Window {
    __pulseOpsBoundaryLogKeys?: Set<string>;
  }
}

export function reportClientErrorBoundary({
  boundary,
  error,
}: ReportClientErrorBoundaryInput) {
  if (typeof window === "undefined") {
    return;
  }

  const dedupeKey = [
    boundary,
    window.location.pathname,
    error.name,
    error.message,
    error.digest ?? "",
  ].join("|");

  const loggedKeys = (window.__pulseOpsBoundaryLogKeys ??= new Set<string>());

  if (loggedKeys.has(dedupeKey)) {
    return;
  }

  loggedKeys.add(dedupeKey);

  const reportPayload = JSON.stringify({
    boundary,
    digest: error.digest,
    message: error.message,
    name: error.name,
    pathname: window.location.pathname,
    stack: error.stack,
    userAgent: navigator.userAgent,
  });

  if ("sendBeacon" in navigator) {
    const queued = navigator.sendBeacon(
      "/api/observability/error-boundary",
      new Blob([reportPayload], { type: "application/json" }),
    );

    if (queued) {
      return;
    }
  }

  void fetch("/api/observability/error-boundary", {
    body: reportPayload,
    headers: {
      "content-type": "application/json",
    },
    keepalive: true,
    method: "POST",
  });
}
