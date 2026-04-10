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
import {
  handleDocumentsListRequest,
  listDocumentsForOrg,
} from "@/features/documents/server/handle-documents-list-request";
import { ensureCuratedDocumentsSeeded } from "@/features/documents/server/seed-curated-documents";
import { createLocalEntityRepository } from "@/features/entities/repositories/local-entity-repository";
import { createCanonicalFactRecord } from "@/features/facts/domain/canonical-fact-record";
import { createLocalFactRepository } from "@/features/facts/repositories/local-fact-repository";
import { createLocalParserArtifactRepository } from "@/features/parsing/repositories/local-parser-artifact-repository";
import { createLocalObjectStorage } from "@/features/storage/lib/local-object-storage";
import { createCitation } from "@/features/trust/domain/citation";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("handleDocumentsListRequest", () => {
  it("returns validation errors for invalid query parameters", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-documents-list-invalid-"),
    );
    temporaryDirectories.push(rootDirectory);

    const response = await handleDocumentsListRequest(
      new Request("http://localhost/api/documents"),
      {
        documentRepository: createLocalDocumentRepository({ rootDirectory }),
        factRepository: createLocalFactRepository({ rootDirectory }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid documents query parameters.",
    });
  });

  it("lists seeded curated documents with fact counts", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-documents-list-seeded-"),
    );
    const storageRoot = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-documents-list-storage-"),
    );
    temporaryDirectories.push(rootDirectory, storageRoot);

    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const factRepository = createLocalFactRepository({ rootDirectory });
    const parserArtifactRepository = createLocalParserArtifactRepository({
      rootDirectory,
    });

    await ensureCuratedDocumentsSeeded({
      documentRepository,
      entityRepository: createLocalEntityRepository({ rootDirectory }),
      factRepository,
      orgId: "org_documents",
      parserArtifactRepository,
      storage: createLocalObjectStorage({ rootDirectory: storageRoot }),
    });

    const response = await handleDocumentsListRequest(
      new Request(
        "http://localhost/api/documents?orgId=org_documents&status=extracted",
      ),
      {
        documentRepository,
        factRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      orgId: "org_documents",
      totalDocuments: 2,
      documents: [
        expect.objectContaining({
          factCount: 3,
          fileName: "supermarket_sales - Sheet1.csv",
          status: "extracted",
        }),
        expect.objectContaining({
          factCount: 3,
          fileName: "10020Records.csv",
          status: "extracted",
        }),
      ],
    });
  });

  it("sorts by updatedAt and filters by status in the list helper", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-documents-list-helper-"),
    );
    temporaryDirectories.push(rootDirectory);

    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const factRepository = createLocalFactRepository({ rootDirectory });

    const parsedDocument = documentSchema.parse({
      ...attachDocumentClassification(
        createUploadedDocument(
          {
            fileName: "older.csv",
            id: "doc_older",
            orgId: "org_123",
          },
          "2026-04-10T01:00:00.000Z",
        ),
        "customer-invoice",
        0.9,
        "2026-04-10T01:05:00.000Z",
      ),
      sizeBytes: 512,
      status: "classified",
    });
    const extractedDocument = documentSchema.parse({
      ...attachDocumentClassification(
        createUploadedDocument(
          {
            fileName: "newer.csv",
            id: "doc_newer",
            orgId: "org_123",
            source: "api",
          },
          "2026-04-10T02:00:00.000Z",
        ),
        "job-cost-report",
        0.8,
        "2026-04-10T02:05:00.000Z",
      ),
      sizeBytes: 2048,
      status: "extracted",
    });

    await documentRepository.put(parsedDocument);
    await documentRepository.put(extractedDocument);
    await factRepository.put(
      createCanonicalFactRecord({
        canonicalFactTypeId: "document.observation.number",
        citations: [
          createCitation({
            confidenceScore: 0.95,
            documentFamily: "job-cost-report",
            documentId: "doc_newer",
            locator: { row: 1 },
            locatorType: "row",
            sourceHash: "sha256:newer",
          }),
        ],
        confidenceScore: 0.95,
        documentFamily: "job-cost-report",
        documentId: "doc_newer",
        entityId: "entity_newer",
        entityType: "document",
        orgId: "org_123",
        sourceFieldKey: "row_count",
        value: 1,
      }),
    );

    await expect(
      listDocumentsForOrg({
        documentRepository,
        factRepository,
        orgId: "org_123",
      }),
    ).resolves.toMatchObject([
      expect.objectContaining({
        factCount: 1,
        fileName: "newer.csv",
        id: "doc_newer",
      }),
      expect.objectContaining({
        factCount: 0,
        fileName: "older.csv",
        id: "doc_older",
      }),
    ]);

    await expect(
      listDocumentsForOrg({
        documentRepository,
        factRepository,
        orgId: "org_123",
        statuses: ["classified"],
      }),
    ).resolves.toMatchObject([
      expect.objectContaining({
        fileName: "older.csv",
        status: "classified",
      }),
    ]);
  });
});
