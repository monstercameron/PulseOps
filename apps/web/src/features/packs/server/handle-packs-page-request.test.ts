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
import { handlePacksPageRequest } from "@/features/packs/server/handle-packs-page-request";
import { createCitation } from "@/features/trust/domain/citation";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("handlePacksPageRequest", () => {
  it("returns fallback pack data when no documents exist", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-packs-empty-"),
    );
    temporaryDirectories.push(rootDirectory);

    const response = await handlePacksPageRequest(
      new Request("http://localhost/api/packs?orgId=org_123"),
      {
        documentRepository: createLocalDocumentRepository({ rootDirectory }),
        factRepository: createLocalFactRepository({ rootDirectory }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      packs: expect.arrayContaining([
        expect.objectContaining({ title: "Cash and Margin Brief" }),
      ]),
    });
  });

  it("maps workspace documents into the primary pack source data", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-packs-data-"),
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
        orgId: "org_123",
        sourceFieldKey: "amount_outstanding",
        value: 2100,
      }),
    );

    const response = await handlePacksPageRequest(
      new Request("http://localhost/api/packs?orgId=org_123"),
      {
        documentRepository,
        factRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      packs: expect.arrayContaining([
        expect.objectContaining({
          meta: expect.arrayContaining(["Based on 1 records"]),
          sourceData: expect.arrayContaining([
            expect.objectContaining({ name: "invoice-001.csv" }),
          ]),
        }),
      ]),
    });
  });
});
