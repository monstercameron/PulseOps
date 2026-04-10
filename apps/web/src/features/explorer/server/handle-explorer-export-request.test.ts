import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import {
  attachDocumentClassification,
  createUploadedDocument,
  documentSchema,
} from "@/features/documents/domain/document";
import { createLocalDocumentRepository } from "@/features/documents/repositories/local-document-repository";
import { createLocalFactRepository } from "@/features/facts/repositories/local-fact-repository";
import { handleExplorerExportRequest } from "@/features/explorer/server/handle-explorer-export-request";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("handleExplorerExportRequest", () => {
  it("exports records filtered by the current type and query", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-explorer-export-"),
    );
    temporaryDirectories.push(rootDirectory);

    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const factRepository = createLocalFactRepository({ rootDirectory });
    const uploadedInvoice = attachDocumentClassification(
      createUploadedDocument(
        {
          fileName: "invoice-001.csv",
          id: "doc_invoice",
          orgId: "org_123",
          source: "upload",
        },
        "2026-04-10T01:00:00.000Z",
      ),
      "customer-invoice",
      0.92,
      "2026-04-10T01:05:00.000Z",
    );
    const uploadedJobReport = attachDocumentClassification(
      createUploadedDocument(
        {
          fileName: "job-report.csv",
          id: "doc_job",
          orgId: "org_123",
          source: "api",
        },
        "2026-04-10T02:00:00.000Z",
      ),
      "job-cost-report",
      0.88,
      "2026-04-10T02:05:00.000Z",
    );

    await documentRepository.put(
      documentSchema.parse({
        ...uploadedInvoice,
        sizeBytes: 1024,
        status: "extracted",
      }),
    );
    await documentRepository.put(
      documentSchema.parse({
        ...uploadedJobReport,
        sizeBytes: 2048,
        status: "extracted",
      }),
    );

    const response = await handleExplorerExportRequest(
      new Request(
        "http://localhost/api/explorer/records/export?orgId=org_123&type=Customer%20invoice&query=invoice",
      ),
      {
        documentRepository,
        factRepository,
      },
    );

    expect(response.status).toBe(200);
    const responseText = await response.text();

    expect(responseText).toContain('"invoice-001.csv"');
    expect(responseText).not.toContain('"job-report.csv"');
  });
});
