import { describe, expect, it } from "vitest";

import {
  createIngestionEvent,
  estimateUploadIngestCostUsd,
} from "@/features/ingestion/domain/ingestion-event";

describe("ingestion event", () => {
  it("creates upload ingestion envelopes with cost metadata", () => {
    const event = createIngestionEvent({
      archiveAfterDays: 30,
      checksumSha256: "sha256:abc123",
      deduplicated: false,
      documentId: "doc_123",
      fileName: "invoices.csv",
      id: "event_123",
      jobId: "job_123",
      kind: "upload.queued",
      metadata: {
        objectKey: "orgs/org_123/documents/doc_123/2026/04/invoices.csv",
      },
      orgId: "org_123",
      retentionPolicyKey: "manual-upload-hot-30d",
      sizeBytes: 2048,
      source: "upload",
    });

    expect(event.estimatedIngestCostUsd).toBe(
      estimateUploadIngestCostUsd(2048),
    );
  });

  it("marks duplicate uploads explicitly", () => {
    const event = createIngestionEvent({
      archiveAfterDays: 30,
      checksumSha256: "sha256:abc123",
      deduplicated: true,
      documentId: "doc_123",
      fileName: "invoices.csv",
      id: "event_123",
      jobId: "job_123",
      kind: "upload.duplicate",
      metadata: {
        duplicateOfDocumentId: "doc_123",
      },
      orgId: "org_123",
      retentionPolicyKey: "manual-upload-hot-30d",
      sizeBytes: 2048,
      source: "upload",
    });

    expect(event.kind).toBe("upload.duplicate");
    expect(event.deduplicated).toBe(true);
  });
});
