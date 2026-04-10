import { describe, expect, it, vi } from "vitest";

import { type ProcessedQueuedTabularUpload } from "@/features/ingestion/services/process-next-ingestion-job";
import { createDefaultSettingsRecord } from "@/features/settings/domain/settings-record";
import { settingsPreferenceIds } from "@/features/settings/domain/settings-preferences";
import { handleFileUpload } from "@/features/uploads/server/handle-file-upload";

describe("handleFileUpload", () => {
  it("accepts tabular uploads and returns queued ingestion ids", async () => {
    const formData = new FormData();

    formData.set(
      "file",
      new File(["invoice_id,amount_due\nINV-001,4200"], "invoices.csv", {
        type: "text/csv",
      }),
    );
    formData.set("orgId", "org_123");

    const response = await handleFileUpload(
      new Request("http://localhost/api/ingest/upload", {
        body: formData,
        method: "POST",
      }),
      {
        documentRepository: {} as never,
        ingestionEventRepository: {} as never,
        ingestionJobRepository: {} as never,
        queue: {} as never,
        storage: {} as never,
        submitTabularUpload: vi.fn(async () => ({
          document: { id: "doc_123" },
          ingestionEvent: { id: "event_123" },
          ingestionJob: { id: "job_123", status: "queued" },
          isDuplicate: false,
        })),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      classificationConfidenceScore: null,
      detectedFormat: "csv",
      documentId: "doc_123",
      ingestionEventId: "event_123",
      ingestionJobId: "job_123",
      isDuplicate: false,
      materializedChunkCount: null,
      materializedFactCount: null,
      nextAction: "pipeline",
      parserRoute: "tabular",
      processedStatus: null,
      retainSourceFile: true,
      reviewState: "processing",
      status: "queued",
      suggestedDocumentFamily: null,
    });
  });

  it("accepts supported json uploads", async () => {
    const formData = new FormData();

    formData.set(
      "file",
      new File(
        [JSON.stringify({ amountDue: 4200, invoiceId: "INV-001" })],
        "invoice.json",
        { type: "application/json" },
      ),
    );
    formData.set("orgId", "org_123");

    const response = await handleFileUpload(
      new Request("http://localhost/api/ingest/upload", {
        body: formData,
        method: "POST",
      }),
      {
        documentRepository: {} as never,
        ingestionEventRepository: {} as never,
        ingestionJobRepository: {} as never,
        queue: {} as never,
        storage: {} as never,
        submitTabularUpload: vi.fn(async () => ({
          document: { id: "doc_456" },
          ingestionEvent: { id: "event_456" },
          ingestionJob: { id: "job_456", status: "queued" },
          isDuplicate: false,
        })),
      },
    );

    expect(response.status).toBe(200);
  });

  it("uses the workspace retention preference when submitting uploads", async () => {
    const formData = new FormData();
    const submitTabularUpload = vi.fn(async () => ({
      document: { id: "doc_999" },
      ingestionEvent: { id: "event_999" },
      ingestionJob: { id: "job_999", status: "queued" },
      isDuplicate: false,
    }));
    const settingsRecord = createDefaultSettingsRecord(
      "org_123",
      "2026-04-10T12:00:00.000Z",
    );

    formData.set(
      "file",
      new File(["invoice_id,amount_due\nINV-001,4200"], "invoices.csv", {
        type: "text/csv",
      }),
    );
    formData.set("orgId", "org_123");

    const response = await handleFileUpload(
      new Request("http://localhost/api/ingest/upload", {
        body: formData,
        method: "POST",
      }),
      {
        documentRepository: {} as never,
        ingestionEventRepository: {} as never,
        ingestionJobRepository: {} as never,
        queue: {} as never,
        settingsRepository: {
          getByOrgId: vi.fn(async () => ({
            ...settingsRecord,
            preferences: settingsRecord.preferences.map((preference) =>
              preference.id === settingsPreferenceIds.retainUploadedSourceFiles
                ? { ...preference, enabled: false }
                : preference,
            ),
          })),
          put: vi.fn(),
        },
        storage: {} as never,
        submitTabularUpload,
      },
    );

    expect(response.status).toBe(200);
    expect(submitTabularUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "org_123",
        retainSourceFile: false,
      }),
    );
  });

  it("rejects unsupported file extensions", async () => {
    const formData = new FormData();

    formData.set(
      "file",
      new File([new Uint8Array([0x00, 0x01, 0x02, 0x03])], "notes.bin", {
        type: "application/octet-stream",
      }),
    );
    formData.set("orgId", "org_123");

    const response = await handleFileUpload(
      new Request("http://localhost/api/ingest/upload", {
        body: formData,
        method: "POST",
      }),
      {
        documentRepository: {} as never,
        ingestionEventRepository: {} as never,
        ingestionJobRepository: {} as never,
        queue: {} as never,
        storage: {} as never,
        submitTabularUpload: vi.fn(),
      },
    );

    expect(response.status).toBe(415);
  });

  it("rejects uploads when file contents do not match the extension", async () => {
    const formData = new FormData();

    formData.set(
      "file",
      new File(["%PDF-1.7\nhello"], "notes.csv", { type: "text/csv" }),
    );
    formData.set("orgId", "org_123");

    const response = await handleFileUpload(
      new Request("http://localhost/api/ingest/upload", {
        body: formData,
        method: "POST",
      }),
      {
        documentRepository: {} as never,
        ingestionEventRepository: {} as never,
        ingestionJobRepository: {} as never,
        queue: {} as never,
        storage: {} as never,
        submitTabularUpload: vi.fn(),
      },
    );

    expect(response.status).toBe(422);
  });

  it("rejects plain text files renamed as xlsx with a clear validation error", async () => {
    const formData = new FormData();

    formData.set(
      "file",
      new File(["this is not really an xlsx file"], "notes.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );
    formData.set("orgId", "org_123");

    const response = await handleFileUpload(
      new Request("http://localhost/api/ingest/upload", {
        body: formData,
        method: "POST",
      }),
      {
        documentRepository: {} as never,
        ingestionEventRepository: {} as never,
        ingestionJobRepository: {} as never,
        queue: {} as never,
        storage: {} as never,
        submitTabularUpload: vi.fn(),
      },
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      errorCode: "format_mismatch",
      errorHelp:
        "Open the file, export it again in the same format, and then try one more time.",
      errorTitle: "The file contents do not match the file extension",
      error:
        "This file does not match its extension. Please save or export it again, then try once more.",
    });
  });

  it("rejects password-protected pdf uploads", async () => {
    const formData = new FormData();

    formData.set(
      "file",
      new File(["%PDF-1.7\n1 0 obj\n<< /Encrypt 2 0 R >>"], "secure.pdf", {
        type: "application/pdf",
      }),
    );
    formData.set("orgId", "org_123");

    const response = await handleFileUpload(
      new Request("http://localhost/api/ingest/upload", {
        body: formData,
        method: "POST",
      }),
      {
        documentRepository: {} as never,
        ingestionEventRepository: {} as never,
        ingestionJobRepository: {} as never,
        queue: {} as never,
        storage: {} as never,
        submitTabularUpload: vi.fn(),
      },
    );

    expect(response.status).toBe(422);
  });

  it("returns processed extraction status when an upload processor is provided", async () => {
    const formData = new FormData();

    formData.set(
      "file",
      new File(["invoice_id,amount_due\nINV-001,4200"], "invoices.csv", {
        type: "text/csv",
      }),
    );
    formData.set("orgId", "org_123");

    const response = await handleFileUpload(
      new Request("http://localhost/api/ingest/upload", {
        body: formData,
        method: "POST",
      }),
      {
        documentRepository: {
          getById: vi.fn(async () => ({
            classificationConfidenceScore: 0.94,
            createdAt: "2026-04-09T23:00:00.000Z",
            fileName: "invoices.csv",
            id: "doc_789",
            orgId: "org_123",
            source: "upload",
            status: "extracted",
            suggestedDocumentFamily: "customer-invoice",
            updatedAt: "2026-04-09T23:00:01.000Z",
          })),
        } as never,
        ingestionEventRepository: {} as never,
        ingestionJobRepository: {} as never,
        processQueuedUpload: vi.fn(
          async (): Promise<ProcessedQueuedTabularUpload> => ({
            classification: {
              confidenceScore: 0.94,
              matchedSignals: [
                "invoice_id",
                "invoice_number",
                "customer_name",
                "due_date",
                "amount_due",
              ],
              suggestedDocumentFamily: "customer-invoice",
            },
            extractionContractFieldCount: 3,
            format: "csv",
            ingestionJob: {
              attemptCount: 1,
              completedAt: "2026-04-09T23:00:01.000Z",
              createdAt: "2026-04-09T23:00:00.000Z",
              documentId: "doc_789",
              id: "job_789",
              lastUpdatedAt: "2026-04-09T23:00:01.000Z",
              orgId: "org_123",
              startedAt: "2026-04-09T23:00:00.500Z",
              status: "completed",
            },
            materializedChunkCount: 1,
            materializedFactCount: 2,
            message: {
              documentId: "doc_789",
              enqueuedAt: "2026-04-09T23:00:00.250Z",
              jobId: "job_789",
              orgId: "org_123",
              version: "ingestion-queue-message.v1",
            },
          }),
        ),
        queue: {} as never,
        storage: {} as never,
        submitTabularUpload: vi.fn(async () => ({
          document: { id: "doc_789" },
          ingestionEvent: { id: "event_789" },
          ingestionJob: { id: "job_789", status: "queued" },
          isDuplicate: false,
        })),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      classificationConfidenceScore: 0.94,
      detectedFormat: "csv",
      documentId: "doc_789",
      ingestionEventId: "event_789",
      ingestionJobId: "job_789",
      isDuplicate: false,
      materializedChunkCount: 1,
      materializedFactCount: 2,
      nextAction: "explorer",
      parserRoute: "tabular",
      processedStatus: "completed",
      retainSourceFile: true,
      reviewState: "ready",
      status: "completed",
      suggestedDocumentFamily: "customer-invoice",
    });
  });

  it("returns the existing document type for duplicate uploads", async () => {
    const formData = new FormData();

    formData.set(
      "file",
      new File(["vendor_name,bill_number\nUnited Supply,V-100"], "bills.csv", {
        type: "text/csv",
      }),
    );
    formData.set("orgId", "org_123");

    const response = await handleFileUpload(
      new Request("http://localhost/api/ingest/upload", {
        body: formData,
        method: "POST",
      }),
      {
        documentRepository: {
          getById: vi.fn(async () => ({
            classificationConfidenceScore: 0.91,
            createdAt: "2026-04-09T23:00:00.000Z",
            fileName: "bills.csv",
            id: "doc_dup",
            orgId: "org_123",
            source: "upload",
            status: "extracted",
            suggestedDocumentFamily: "vendor-bill",
            updatedAt: "2026-04-09T23:00:01.000Z",
          })),
        } as never,
        ingestionEventRepository: {} as never,
        ingestionJobRepository: {} as never,
        queue: {} as never,
        storage: {} as never,
        submitTabularUpload: vi.fn(async () => ({
          document: { id: "doc_dup" },
          ingestionEvent: { id: "event_dup" },
          ingestionJob: { id: "job_dup", status: "completed" },
          isDuplicate: true,
        })),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      classificationConfidenceScore: 0.91,
      isDuplicate: true,
      reviewState: "duplicate",
      suggestedDocumentFamily: "vendor-bill",
    });
  });
});
