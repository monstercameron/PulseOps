import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  attachDocumentClassification,
  createUploadedDocument,
  documentSchema,
} from "@/features/documents/domain/document";
import { createLocalDocumentRepository } from "@/features/documents/repositories/local-document-repository";
import { createLocalAuditLogRepository } from "@/features/audit/repositories/local-audit-log-repository";
import { handleDocumentStatusUpdateRequest } from "@/features/pipeline/server/handle-document-status-update-request";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("handleDocumentStatusUpdateRequest", () => {
  it("updates the document status, writes an audit log, and requests revalidation", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-pipeline-status-update-"),
    );
    temporaryDirectories.push(rootDirectory);

    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const auditLogRepository = createLocalAuditLogRepository({ rootDirectory });
    const revalidatePaths = vi.fn();
    const uploadedDocument = createUploadedDocument(
      {
        fileName: "invoice-001.csv",
        id: "doc_123",
        orgId: "org_123",
      },
      "2026-04-10T01:00:00.000Z",
    );
    const classifiedDocument = attachDocumentClassification(
      uploadedDocument,
      "customer-invoice",
      0.92,
      "2026-04-10T01:05:00.000Z",
    );

    await documentRepository.put(
      documentSchema.parse({
        ...classifiedDocument,
        parserArtifactId: "artifact_123",
        status: "failed",
        updatedAt: "2026-04-10T01:10:00.000Z",
      }),
    );

    const response = await handleDocumentStatusUpdateRequest(
      new Request("http://localhost/api/pipeline/doc_123/status", {
        body: JSON.stringify({
          actorId: "user_123",
          orgId: "org_123",
          reason: "Retry after parser fix",
          status: "uploaded",
        }),
        method: "PATCH",
      }),
      {
        auditLogRepository,
        documentRepository,
        generateId: () => "audit_123",
        now: () => "2026-04-10T02:00:00.000Z",
        revalidatePaths,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      auditLogId: "audit_123",
      document: {
        id: "doc_123",
        status: "uploaded",
        updatedAt: "2026-04-10T02:00:00.000Z",
      },
    });

    const persistedDocument = await documentRepository.getById("doc_123");
    expect(persistedDocument).toMatchObject({
      id: "doc_123",
      status: "uploaded",
    });
    expect(persistedDocument?.classificationConfidenceScore).toBeUndefined();
    expect(persistedDocument?.parserArtifactId).toBeUndefined();
    expect(persistedDocument?.suggestedDocumentFamily).toBeUndefined();

    await expect(auditLogRepository.listByOrgId("org_123")).resolves.toEqual([
      expect.objectContaining({
        action: "document.status.updated",
        actorId: "user_123",
        entityId: "doc_123",
        id: "audit_123",
        metadata: {
          fromStatus: "failed",
          reason: "Retry after parser fix",
          status: "uploaded",
        },
        orgId: "org_123",
      }),
    ]);
    expect(revalidatePaths).toHaveBeenCalledWith(["/pipeline", "/dashboard"]);
  });

  it("returns 409 for an invalid status transition", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-pipeline-status-invalid-"),
    );
    temporaryDirectories.push(rootDirectory);

    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const auditLogRepository = createLocalAuditLogRepository({ rootDirectory });
    const uploadedDocument = createUploadedDocument(
      {
        fileName: "invoice-001.csv",
        id: "doc_456",
        orgId: "org_123",
      },
      "2026-04-10T01:00:00.000Z",
    );

    await documentRepository.put(
      documentSchema.parse({
        ...attachDocumentClassification(
          uploadedDocument,
          "customer-invoice",
          0.92,
          "2026-04-10T01:05:00.000Z",
        ),
        status: "extracted",
      }),
    );

    const response = await handleDocumentStatusUpdateRequest(
      new Request("http://localhost/api/pipeline/doc_456/status", {
        body: JSON.stringify({
          orgId: "org_123",
          status: "parsed",
        }),
        method: "PATCH",
      }),
      {
        auditLogRepository,
        documentRepository,
      },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid document transition: extracted -> parsed",
    });
    await expect(auditLogRepository.listByOrgId("org_123")).resolves.toEqual([]);
  });

  it("returns 404 when the document does not exist", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-pipeline-status-missing-"),
    );
    temporaryDirectories.push(rootDirectory);

    const response = await handleDocumentStatusUpdateRequest(
      new Request("http://localhost/api/pipeline/doc_missing/status", {
        body: JSON.stringify({
          orgId: "org_123",
          status: "uploaded",
        }),
        method: "PATCH",
      }),
      {
        auditLogRepository: createLocalAuditLogRepository({ rootDirectory }),
        documentRepository: createLocalDocumentRepository({ rootDirectory }),
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: "Document not found.",
    });
  });
});
