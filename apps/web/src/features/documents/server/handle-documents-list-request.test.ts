import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createLocalDocumentRepository } from "@/features/documents/repositories/local-document-repository";
import { handleDocumentsListRequest } from "@/features/documents/server/handle-documents-list-request";
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

    await ensureCuratedDocumentsSeeded({
      documentRepository,
      entityRepository: createLocalEntityRepository({ rootDirectory }),
      factRepository,
      orgId: "org_documents",
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
});
