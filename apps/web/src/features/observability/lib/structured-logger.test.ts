import { describe, expect, it, vi } from "vitest";

import {
  buildStructuredLogEntry,
  emitStructuredLog,
  serializeStructuredLogEntry,
} from "@/features/observability/lib/structured-logger";

describe("structured logger", () => {
  it("serializes stable JSON log entries", () => {
    const serializedEntry = serializeStructuredLogEntry({
      data: {
        parserKind: "csv",
      },
      documentId: "doc_123",
      feature: "ingestion",
      jobId: "job_123",
      level: "info",
      message: "Processed upload.",
      orgId: "org_123",
      requestId: "req_123",
      service: "web",
    });

    const parsedEntry = JSON.parse(serializedEntry) as {
      documentId: string;
      feature: string;
      level: string;
      message: string;
      service: string;
    };

    expect(parsedEntry).toMatchObject({
      documentId: "doc_123",
      feature: "ingestion",
      level: "info",
      message: "Processed upload.",
      service: "web",
    });
  });

  it("adds OpenTelemetry-aligned severity and resource fields", () => {
    const entry = buildStructuredLogEntry({
      feature: "query",
      level: "warn",
      message: "Request was rejected.",
      requestId: "req_123",
      service: "web",
    });

    expect(entry).toMatchObject({
      body: "Request was rejected.",
      resource: {
        "service.name": "web",
      },
      severityNumber: 13,
      severityText: "WARN",
    });
    expect(entry.attributes).toMatchObject({
      "bizops.feature": "query",
      "bizops.request_id": "req_123",
    });
  });

  it("suppresses duplicate logs inside the dedupe window", () => {
    const sink = vi.fn();

    const firstEntry = emitStructuredLog(
      {
        feature: "query",
        level: "error",
        message: "Duplicate failure.",
        service: "web",
      },
      {
        dedupeKey: "duplicate-log",
        sink,
      },
    );
    const secondEntry = emitStructuredLog(
      {
        feature: "query",
        level: "error",
        message: "Duplicate failure.",
        service: "web",
      },
      {
        dedupeKey: "duplicate-log",
        sink,
      },
    );

    expect(firstEntry).not.toBeNull();
    expect(secondEntry).toBeNull();
    expect(sink).toHaveBeenCalledTimes(1);
  });

  it("redacts sensitive log data while keeping correlation context", () => {
    const entry = buildStructuredLogEntry({
      data: {
        checksumSha256:
          "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        fileName: "customer-jane.doe@example.com-invoice.csv",
        objectKey:
          "orgs/org_123/documents/doc_123/2026/04/customer-jane.doe@example.com-invoice.csv",
        responseBody: JSON.stringify({
          error: "Could not process jane.doe@example.com",
          requestId: "req_123",
          token: "super-secret-token",
        }),
      },
      documentId: "doc_123",
      feature: "uploads",
      level: "error",
      message: "Upload failed for jane.doe@example.com",
      requestId: "req_123",
      service: "web",
    });

    expect(entry.message).not.toContain("jane.doe@example.com");
    expect(entry.message).toContain("[REDACTED_EMAIL]");
    expect(entry.data).toMatchObject({
      checksumSha256: {
        kind: "digest",
        prefix: "e3b0c44298fc",
      },
      fileName: {
        extension: "csv",
        kind: "file_name",
      },
      objectKey: {
        extension: "csv",
        kind: "object_key",
      },
      responseBody: {
        error: "Could not process [REDACTED_EMAIL]",
        kind: "response_body",
        requestId: "req_123",
      },
    });
  });
});
