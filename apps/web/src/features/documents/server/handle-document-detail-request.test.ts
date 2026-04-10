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
import { handleDocumentDetailRequest } from "@/features/documents/server/handle-document-detail-request";
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

describe("handleDocumentDetailRequest", () => {
  it("returns the seeded document and its extracted facts", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-document-detail-seeded-"),
    );
    const storageRoot = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-document-detail-storage-"),
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

    const targetDocument = (await documentRepository.listByOrgId("org_documents")).find(
      (document) => document.fileName === "10020Records.csv",
    );

    expect(targetDocument).toBeDefined();

    const response = await handleDocumentDetailRequest(
      new Request(
        `http://localhost/api/documents/${targetDocument?.id}?orgId=org_documents`,
      ),
      {
        documentRepository,
        factRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      document: expect.objectContaining({
        fileName: "10020Records.csv",
        id: targetDocument?.id,
        status: "extracted",
      }),
      facts: expect.arrayContaining([
        expect.objectContaining({
          label: "Rows parsed",
          value: 100,
        }),
        expect.objectContaining({
          label: "Total profit",
          value: 44168198.4,
        }),
      ]),
      orgId: "org_documents",
    });
  });

  it("rejects documents outside the requested org", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-document-detail-org-"),
    );
    const storageRoot = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-document-detail-org-storage-"),
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

    const targetDocument = (await documentRepository.listByOrgId("org_documents"))[0];

    const response = await handleDocumentDetailRequest(
      new Request(
        `http://localhost/api/documents/${targetDocument.id}?orgId=org_other`,
      ),
      {
        documentRepository,
        factRepository,
      },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: "Document does not belong to the provided orgId.",
    });
  });

  it("returns validation and not-found errors for invalid detail requests", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-document-detail-errors-"),
    );
    temporaryDirectories.push(rootDirectory);

    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const factRepository = createLocalFactRepository({ rootDirectory });

    const missingOrgResponse = await handleDocumentDetailRequest(
      new Request("http://localhost/api/documents/doc_123"),
      {
        documentRepository,
        factRepository,
      },
    );
    const missingPathResponse = await handleDocumentDetailRequest(
      new Request("http://localhost/api/other/doc_123?orgId=org_123"),
      {
        documentRepository,
        factRepository,
      },
    );
    const missingDocumentResponse = await handleDocumentDetailRequest(
      new Request("http://localhost/api/documents/doc_missing?orgId=org_123"),
      {
        documentRepository,
        factRepository,
      },
    );

    expect(missingOrgResponse.status).toBe(400);
    await expect(missingOrgResponse.json()).resolves.toMatchObject({
      error: "Missing orgId query parameter.",
    });
    expect(missingPathResponse.status).toBe(400);
    await expect(missingPathResponse.json()).resolves.toMatchObject({
      error: "Missing documentId path parameter.",
    });
    expect(missingDocumentResponse.status).toBe(404);
    await expect(missingDocumentResponse.json()).resolves.toMatchObject({
      error: "Document not found.",
    });
  });

  it("falls back to the canonical fact type id when a fact label is missing", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-document-detail-label-"),
    );
    temporaryDirectories.push(rootDirectory);

    const documentRepository = createLocalDocumentRepository({ rootDirectory });
    const factRepository = createLocalFactRepository({ rootDirectory });

    await documentRepository.put(
      documentSchema.parse({
        ...attachDocumentClassification(
          createUploadedDocument(
            {
              fileName: "factless-label.csv",
              id: "doc_label",
              orgId: "org_123",
            },
            "2026-04-10T01:00:00.000Z",
          ),
          "generic-business-document",
          0.7,
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
            confidenceScore: 0.9,
            documentFamily: "generic-business-document",
            documentId: "doc_label",
            locator: { row: 1 },
            locatorType: "row",
            sourceHash: "sha256:label",
          }),
        ],
        confidenceScore: 0.9,
        documentFamily: "generic-business-document",
        documentId: "doc_label",
        entityId: "entity_label",
        entityType: "document",
        orgId: "org_123",
        sourceFieldKey: "row_count",
        value: 5,
      }),
    );

    const response = await handleDocumentDetailRequest(
      new Request("http://localhost/api/documents/doc_label?orgId=org_123"),
      {
        documentRepository,
        factRepository,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      facts: [
        expect.objectContaining({
          label: "document.observation.number",
        }),
      ],
    });
  });
});
