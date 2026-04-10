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
import { createCanonicalFactRecord } from "@/features/facts/domain/canonical-fact-record";
import { createLocalFactRepository } from "@/features/facts/repositories/local-fact-repository";
import { handleExplorerRecordsRequest } from "@/features/explorer/server/handle-explorer-records-request";
import { createCitation } from "@/features/trust/domain/citation";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("handleExplorerRecordsRequest", () => {
  it("returns an honest empty explorer payload when no records exist", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-explorer-empty-"),
    );
    temporaryDirectories.push(rootDirectory);

    const response = await handleExplorerRecordsRequest(
      new Request("http://localhost/api/explorer/records?orgId=org_123"),
      {
        documentRepository: createLocalDocumentRepository({ rootDirectory }),
        factRepository: createLocalFactRepository({ rootDirectory }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      filters: ["All records"],
      orgId: "org_123",
      records: [],
      summary: {
        averageConfidence: "--",
        needsReviewCount: "0",
        totalRecords: "0",
      },
    });
  });

  it("maps repository documents and facts into explorer records", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-explorer-records-"),
    );
    temporaryDirectories.push(rootDirectory);

    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const factRepository = createLocalFactRepository({ rootDirectory });

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
        sizeBytes: 1024,
        source: "upload",
        status: "extracted",
      }),
    );
    await factRepository.put(
      createCanonicalFactRecord({
        canonicalFactTypeId: "invoice.amount.outstanding",
        citations: [
          createCitation({
            confidenceScore: 0.93,
            documentFamily: "customer-invoice",
            documentId: "doc_123",
            locator: { row: 2 },
            locatorType: "row",
            sourceHash: "sha256:invoice-row",
          }),
        ],
        confidenceScore: 0.93,
        documentFamily: "customer-invoice",
        documentId: "doc_123",
        entityId: "entity_invoice_123",
        entityType: "invoice",
        label: "Outstanding balance",
        orgId: "org_123",
        sourceFieldKey: "amount_outstanding",
        value: 2100,
      }),
    );

    const response = await handleExplorerRecordsRequest(
      new Request("http://localhost/api/explorer/records?orgId=org_123"),
      {
        documentRepository,
        factRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      filters: ["All records", "Customer invoice"],
      orgId: "org_123",
      records: [
        {
          confidenceScore: 0.92,
          detailCitations: ["invoice-001.csv - row 2"],
          detailFacts: [
            {
              key: "Outstanding balance",
              value: "2100",
            },
          ],
          documentMeta: "Manual upload - 1 KB",
          documentName: "invoice-001.csv",
          factsSummary: "1 extracted fact",
          statusLabel: "Extracted",
          typeLabel: "Customer invoice",
        },
      ],
      summary: {
        averageConfidence: "0.92",
        totalRecords: "1",
      },
    });
  });

  it("filters explorer records by status and documentId when requested", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-explorer-filtered-"),
    );
    temporaryDirectories.push(rootDirectory);

    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const factRepository = createLocalFactRepository({ rootDirectory });
    const uploadedDocument = createUploadedDocument(
      {
        fileName: "invoice-001.csv",
        id: "doc_123",
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
        sizeBytes: 1024,
        source: "upload",
        status: "classified",
      }),
    );
    await documentRepository.put(
      documentSchema.parse({
        ...createUploadedDocument(
          {
            fileName: "invoice-002.csv",
            id: "doc_456",
            orgId: "org_123",
            source: "email",
          },
          "2026-04-10T02:00:00.000Z",
        ),
        sizeBytes: 2048,
        status: "failed",
      }),
    );
    await factRepository.put(
      createCanonicalFactRecord({
        canonicalFactTypeId: "invoice.amount.outstanding",
        citations: [
          createCitation({
            confidenceScore: 0.93,
            documentFamily: "customer-invoice",
            documentId: "doc_123",
            locator: { row: 2 },
            locatorType: "row",
            sourceHash: "sha256:invoice-row",
          }),
        ],
        confidenceScore: 0.93,
        documentFamily: "customer-invoice",
        documentId: "doc_123",
        entityId: "entity_invoice_123",
        entityType: "invoice",
        orgId: "org_123",
        sourceFieldKey: "amount_outstanding",
        value: 2100,
      }),
    );

    const response = await handleExplorerRecordsRequest(
      new Request(
        "http://localhost/api/explorer/records?orgId=org_123&status=classified&documentId=doc_123",
      ),
      {
        documentRepository,
        factRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      filters: ["All records", "Customer invoice"],
      orgId: "org_123",
      records: [
        expect.objectContaining({
          documentName: "invoice-001.csv",
          id: "doc_123",
          statusLabel: "Needs review",
        }),
      ],
      summary: {
        averageConfidence: "0.92",
        needsReviewCount: "1",
        totalRecords: "1",
      },
    });
  });

  it("returns validation errors for missing or invalid query parameters", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-explorer-errors-"),
    );
    temporaryDirectories.push(rootDirectory);

    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const factRepository = createLocalFactRepository({ rootDirectory });

    const missingOrgResponse = await handleExplorerRecordsRequest(
      new Request("http://localhost/api/explorer/records"),
      {
        documentRepository,
        factRepository,
      },
    );
    const invalidStatusResponse = await handleExplorerRecordsRequest(
      new Request(
        "http://localhost/api/explorer/records?orgId=org_123&status=not-a-status",
      ),
      {
        documentRepository,
        factRepository,
      },
    );

    expect(missingOrgResponse.status).toBe(400);
    await expect(missingOrgResponse.json()).resolves.toMatchObject({
      error: "Missing orgId query parameter.",
    });
    expect(invalidStatusResponse.status).toBe(400);
    await expect(invalidStatusResponse.json()).resolves.toMatchObject({
      error: "Invalid explorer query parameters.",
    });
  });

  it("falls back to canonical ids and locator types when labels or locator fields are absent", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-explorer-fallbacks-"),
    );
    temporaryDirectories.push(rootDirectory);

    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const factRepository = createLocalFactRepository({ rootDirectory });

    await documentRepository.put(
      documentSchema.parse({
        ...attachDocumentClassification(
          createUploadedDocument(
            {
              fileName: "api-summary.csv",
              id: "doc_api",
              orgId: "org_123",
              source: "api",
            },
            "2026-04-10T01:00:00.000Z",
          ),
          "generic-business-document",
          0.81,
          "2026-04-10T01:05:00.000Z",
        ),
        status: "extracted",
      }),
    );
    await factRepository.put(
      createCanonicalFactRecord({
        canonicalFactTypeId: "document.observation.number",
        citations: [
          createCitation({
            confidenceScore: 0.84,
            documentFamily: "generic-business-document",
            documentId: "doc_api",
            locator: {},
            locatorType: "field",
            sourceHash: "sha256:api-summary",
          }),
        ],
        confidenceScore: 0.84,
        documentFamily: "generic-business-document",
        documentId: "doc_api",
        entityId: "entity_api",
        entityType: "document",
        orgId: "org_123",
        sourceFieldKey: "observed_value",
        value: 42,
      }),
    );

    const response = await handleExplorerRecordsRequest(
      new Request("http://localhost/api/explorer/records?orgId=org_123"),
      {
        documentRepository,
        factRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      records: [
        expect.objectContaining({
          detailCitations: ["api-summary.csv - field"],
          detailFacts: [
            expect.objectContaining({
              key: "document.observation.number",
            }),
          ],
          documentMeta: "Connected API - size unavailable",
          sourceLabel: "Connected API",
          typeLabel: "Generic business document",
        }),
      ],
    });
  });
});
