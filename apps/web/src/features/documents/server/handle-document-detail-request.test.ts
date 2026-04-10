import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createLocalDocumentRepository } from "@/features/documents/repositories/local-document-repository";
import { handleDocumentDetailRequest } from "@/features/documents/server/handle-document-detail-request";
import { ensureCuratedDocumentsSeeded } from "@/features/documents/server/seed-curated-documents";
import { createLocalEntityRepository } from "@/features/entities/repositories/local-entity-repository";
import { createLocalFactRepository } from "@/features/facts/repositories/local-fact-repository";
import { createLocalObjectStorage } from "@/features/storage/lib/local-object-storage";

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

    await ensureCuratedDocumentsSeeded({
      documentRepository,
      entityRepository: createLocalEntityRepository({ rootDirectory }),
      factRepository,
      orgId: "org_documents",
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

    await ensureCuratedDocumentsSeeded({
      documentRepository,
      entityRepository: createLocalEntityRepository({ rootDirectory }),
      factRepository,
      orgId: "org_documents",
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
});
