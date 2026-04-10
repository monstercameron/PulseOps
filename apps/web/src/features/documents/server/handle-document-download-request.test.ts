import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import {
  attachStoredObjectToDocument,
  createUploadedDocument,
} from "@/features/documents/domain/document";
import { createLocalDocumentRepository } from "@/features/documents/repositories/local-document-repository";
import { handleDocumentDownloadRequest } from "@/features/documents/server/handle-document-download-request";
import { createLocalObjectStorage } from "@/features/storage/lib/local-object-storage";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("handleDocumentDownloadRequest", () => {
  it("returns the stored file as an attachment when the raw upload is retained", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-document-download-"),
    );
    temporaryDirectories.push(rootDirectory);

    const documentRepository = createLocalDocumentRepository({
      rootDirectory: path.join(rootDirectory, "records"),
    });
    const storage = createLocalObjectStorage({
      now: () => "2026-04-10T10:00:00.000Z",
      rootDirectory: path.join(rootDirectory, "storage"),
    });
    const uploadedDocument = createUploadedDocument(
      {
        fileName: "invoice-001.csv",
        id: "doc_123",
        orgId: "org_123",
      },
      "2026-04-10T10:00:00.000Z",
    );
    const storedObject = await storage.putObject({
      body: Buffer.from("invoice_id,amount_due\nINV-001,4200", "utf8"),
      contentType: "text/csv",
      key: "orgs/org_123/documents/doc_123/2026/04/invoice-001.csv",
      metadata: {
        documentId: "doc_123",
        orgId: "org_123",
      },
    });

    await documentRepository.put(
      attachStoredObjectToDocument(
        uploadedDocument,
        storedObject,
        "2026-04-10T10:00:01.000Z",
      ),
    );

    const response = await handleDocumentDownloadRequest(
      new Request("http://localhost/api/documents/doc_123/download?orgId=org_123"),
      {
        documentRepository,
        storage,
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="invoice-001.csv"',
    );
    expect(response.headers.get("content-type")).toBe("text/csv");
    await expect(response.text()).resolves.toContain("INV-001");
  });

  it("returns a clear error when the original file was not retained", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-document-download-missing-"),
    );
    temporaryDirectories.push(rootDirectory);

    const documentRepository = createLocalDocumentRepository({
      rootDirectory: path.join(rootDirectory, "records"),
    });

    await documentRepository.put(
      createUploadedDocument(
        {
          fileName: "invoice-001.csv",
          id: "doc_123",
          orgId: "org_123",
        },
        "2026-04-10T10:00:00.000Z",
      ),
    );

    const response = await handleDocumentDownloadRequest(
      new Request("http://localhost/api/documents/doc_123/download?orgId=org_123"),
      {
        documentRepository,
        storage: createLocalObjectStorage({
          rootDirectory: path.join(rootDirectory, "storage"),
        }),
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("not retained"),
    });
  });
});
