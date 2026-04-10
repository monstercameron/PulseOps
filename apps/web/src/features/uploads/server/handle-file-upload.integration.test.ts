import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createLocalDocumentRepository } from "@/features/documents/repositories/local-document-repository";
import { createInMemoryIngestionQueue } from "@/features/ingestion/queue/in-memory-ingestion-queue";
import { createLocalIngestionEventRepository } from "@/features/ingestion/repositories/local-ingestion-event-repository";
import { createLocalIngestionJobRepository } from "@/features/ingestion/repositories/local-ingestion-job-repository";
import { processNextIngestionJob } from "@/features/ingestion/services/process-next-ingestion-job";
import { submitTabularUploadToQueue } from "@/features/ingestion/services/submit-tabular-upload-to-queue";
import { readCuratedAssetDocument } from "@/features/ingestion/testing/asset-documents";
import { createLocalParserArtifactRepository } from "@/features/parsing/repositories/local-parser-artifact-repository";
import { createLocalTextParserArtifactRepository } from "@/features/parsing/repositories/local-text-parser-artifact-repository";
import { createLocalObjectStorage } from "@/features/storage/lib/local-object-storage";
import { handleFileUpload } from "@/features/uploads/server/handle-file-upload";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("handleFileUpload integration", () => {
  it("queues a real asset-backed CSV upload and persists ingestion state", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-upload-route-"),
    );
    temporaryDirectories.push(rootDirectory);

    const recordsRoot = path.join(rootDirectory, "records");
    const documentRepository = createLocalDocumentRepository({
      rootDirectory: recordsRoot,
    });
    const ingestionEventRepository = createLocalIngestionEventRepository({
      rootDirectory: recordsRoot,
    });
    const ingestionJobRepository = createLocalIngestionJobRepository({
      rootDirectory: recordsRoot,
    });
    const queue = createInMemoryIngestionQueue();
    const storage = createLocalObjectStorage({
      now: () => "2026-04-09T20:00:00.000Z",
      rootDirectory: path.join(rootDirectory, "storage"),
    });
    const uploadBody = await readCuratedAssetDocument("10020Records.csv");
    const formData = new FormData();

    formData.set(
      "file",
      new File([new Uint8Array(uploadBody)], "10020Records.csv", {
        type: "text/csv",
      }),
    );
    formData.set("orgId", "org_123");

    const response = await handleFileUpload(
      new Request("http://localhost/api/ingest/upload", {
        body: formData,
        method: "POST",
      }),
      {
        documentRepository,
        ingestionEventRepository,
        ingestionJobRepository,
        queue,
        storage,
        submitTabularUpload: (input) =>
          submitTabularUploadToQueue({
            ...input,
            now: () => "2026-04-09T20:00:00.000Z",
          }),
      },
    );

    const payload = (await response.json()) as {
      documentId: string;
      ingestionEventId: string;
      ingestionJobId: string;
      isDuplicate: boolean;
      status: string;
    };
    const persistedDocument = await documentRepository.getById(
      payload.documentId,
    );
    const persistedJob = await ingestionJobRepository.getById(
      payload.ingestionJobId,
    );
    const persistedEvents = await ingestionEventRepository.listByDocumentId(
      payload.documentId,
    );

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      ingestionEventId: expect.any(String),
      isDuplicate: false,
      status: "queued",
    });
    expect(await queue.size()).toBe(1);
    expect(persistedDocument).toMatchObject({
      fileName: "10020Records.csv",
      orgId: "org_123",
      sizeBytes: uploadBody.byteLength,
      status: "stored",
    });
    expect(persistedDocument?.checksumSha256).toBeDefined();
    expect(persistedJob).toMatchObject({
      id: payload.ingestionJobId,
      status: "queued",
    });
    expect(persistedEvents).toHaveLength(1);
    expect(persistedEvents[0]).toMatchObject({
      documentId: payload.documentId,
      kind: "upload.queued",
    });
  });

  it("classifies curated field-service fixtures across multiple document families", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-upload-route-families-"),
    );
    temporaryDirectories.push(rootDirectory);

    const recordsRoot = path.join(rootDirectory, "records");
    const documentRepository = createLocalDocumentRepository({
      rootDirectory: recordsRoot,
    });
    const ingestionEventRepository = createLocalIngestionEventRepository({
      rootDirectory: recordsRoot,
    });
    const ingestionJobRepository = createLocalIngestionJobRepository({
      rootDirectory: recordsRoot,
    });
    const parserArtifactRepository = createLocalParserArtifactRepository({
      rootDirectory: recordsRoot,
    });
    const textParserArtifactRepository =
      createLocalTextParserArtifactRepository({
        rootDirectory: recordsRoot,
      });
    const queue = createInMemoryIngestionQueue();
    const storage = createLocalObjectStorage({
      now: () => "2026-04-09T20:30:00.000Z",
      rootDirectory: path.join(rootDirectory, "storage"),
    });
    const fixtures = [
      {
        expectedFamily: "customer-invoice",
        fileName: "field-service-customer-invoice.csv",
      },
      {
        expectedFamily: "vendor-bill",
        fileName: "field-service-vendor-bill.csv",
      },
      {
        expectedFamily: "job-cost-report",
        fileName: "field-service-job-cost-report.csv",
      },
    ] as const;

    for (const fixture of fixtures) {
      const uploadBody = await readCuratedAssetDocument(fixture.fileName);
      const formData = new FormData();

      formData.set(
        "file",
        new File([new Uint8Array(uploadBody)], fixture.fileName, {
          type: "text/csv",
        }),
      );
      formData.set("orgId", "org_123");

      const response = await handleFileUpload(
        new Request("http://localhost/api/ingest/upload", {
          body: formData,
          method: "POST",
        }),
        {
          documentRepository,
          ingestionEventRepository,
          ingestionJobRepository,
          processQueuedUpload: () =>
            processNextIngestionJob({
              documentRepository,
              ingestionJobRepository,
              parserArtifactRepository,
              queue,
              storage,
              textParserArtifactRepository,
            }),
          queue,
          storage,
          submitTabularUpload: (input) =>
            submitTabularUploadToQueue({
              ...input,
              now: () => "2026-04-09T20:30:00.000Z",
            }),
        },
      );

      await expect(response.json()).resolves.toMatchObject({
        classificationConfidenceScore: expect.any(Number),
        reviewState: "processing",
        suggestedDocumentFamily: fixture.expectedFamily,
      });
    }
  });
});
