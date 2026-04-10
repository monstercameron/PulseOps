import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createUploadedDocument, documentSchema } from "@/features/documents/domain/document";
import { createLocalDocumentRepository } from "@/features/documents/repositories/local-document-repository";
import { createCanonicalFactRecord } from "@/features/facts/domain/canonical-fact-record";
import { createLocalFactRepository } from "@/features/facts/repositories/local-fact-repository";
import {
  buildSignalsFromWorkspaceData,
  handleSignalsRequest,
} from "@/features/signals/server/handle-signals-request";
import { createCitation } from "@/features/trust/domain/citation";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("handleSignalsRequest", () => {
  it("returns computed signals for the current workspace", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-signals-"),
    );
    temporaryDirectories.push(rootDirectory);

    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const factRepository = createLocalFactRepository({ rootDirectory });

    await documentRepository.put(
      documentSchema.parse({
        ...createUploadedDocument(
          {
            fileName: "failed-invoice.csv",
            id: "doc_123",
            orgId: "org_123",
            source: "email",
          },
          "2026-04-10T01:00:00.000Z",
        ),
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

    const response = await handleSignalsRequest(
      new Request("http://localhost/api/signals?orgId=org_123"),
      {
        documentRepository,
        factRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      signals: expect.arrayContaining([
        expect.objectContaining({ label: "Pipeline risk", value: "1" }),
        expect.objectContaining({ label: "Fact coverage", value: "1" }),
      ]),
    });
  });

  it("builds source and extraction signals from the supplied workspace data", () => {
    const failedEmailDocument = documentSchema.parse({
      ...createUploadedDocument(
        {
          fileName: "failed-invoice.csv",
          id: "doc_123",
          orgId: "org_123",
          source: "email",
        },
        "2026-04-10T01:00:00.000Z",
      ),
      status: "failed",
    });
    const extractedApiDocument = documentSchema.parse({
      ...createUploadedDocument(
        {
          fileName: "job-report.csv",
          id: "doc_456",
          orgId: "org_123",
          source: "api",
        },
        "2026-04-10T02:00:00.000Z",
      ),
      status: "extracted",
    });
    const facts = [
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
    ];

    expect(
      buildSignalsFromWorkspaceData({
        documents: [failedEmailDocument, extractedApiDocument],
        facts,
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Pipeline risk", value: "1" }),
        expect.objectContaining({ label: "Pack readiness", value: "1" }),
        expect.objectContaining({ label: "Fact coverage", value: "1" }),
        expect.objectContaining({ label: "Email intake", value: "1" }),
        expect.objectContaining({ label: "Connected sources", value: "1" }),
      ]),
    );
  });
});
