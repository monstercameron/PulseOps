import { describe, expect, it } from "vitest";

import {
  buildErrorFingerprint,
  logServerError,
} from "@/features/observability/lib/error-logging";

describe("error logging", () => {
  it("builds stable fingerprints for the same error shape", () => {
    const firstFingerprint = buildErrorFingerprint({
      feature: "uploads",
      message: "Broken upload.",
      name: "UploadError",
      route: "/api/ingest/upload",
      stack: "UploadError: Broken upload.\n at line 1",
    });
    const secondFingerprint = buildErrorFingerprint({
      feature: "uploads",
      message: "Broken upload.",
      name: "UploadError",
      route: "/api/ingest/upload",
      stack: "UploadError: Broken upload.\n at line 1",
    });

    expect(firstFingerprint).toBe(secondFingerprint);
  });

  it("deduplicates repeated server error logs by request and fingerprint", () => {
    const firstLog = logServerError({
      dedupeKey: "error:req_123:fingerprint",
      error: new Error("Broken upload."),
      feature: "uploads",
      message: "Route handler failed.",
      requestId: "req_123",
      route: "/api/ingest/upload",
      service: "web",
    });
    const secondLog = logServerError({
      dedupeKey: "error:req_123:fingerprint",
      error: new Error("Broken upload."),
      feature: "uploads",
      message: "Route handler failed.",
      requestId: "req_123",
      route: "/api/ingest/upload",
      service: "web",
    });

    expect(firstLog?.exception?.message).toBe("Broken upload.");
    expect(secondLog).toBeNull();
  });

  it("sanitizes exception context before it is emitted", () => {
    const logEntry = logServerError({
      data: {
        fileName: "accounts-jane.doe@example.com.csv",
      },
      error: new Error(
        "Failed to process jane.doe@example.com with token Bearer abc123",
      ),
      feature: "uploads",
      message: "Route handler failed for jane.doe@example.com",
      requestId: "req_789",
      route: "/api/ingest/upload",
      service: "web",
    });

    expect(logEntry?.message).toContain("[REDACTED_EMAIL]");
    expect(logEntry?.exception?.message).toContain("[REDACTED_EMAIL]");
    expect(logEntry?.exception?.message).toContain("[REDACTED_TOKEN]");
    expect(logEntry?.data).toMatchObject({
      fileName: {
        extension: "csv",
        kind: "file_name",
      },
    });
  });
});
