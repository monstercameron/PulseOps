import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createLocalDocumentRepository } from "@/features/documents/repositories/local-document-repository";
import { createInMemoryIngestionQueue } from "@/features/ingestion/queue/in-memory-ingestion-queue";
import { createLocalIngestionEventRepository } from "@/features/ingestion/repositories/local-ingestion-event-repository";
import { createLocalIngestionJobRepository } from "@/features/ingestion/repositories/local-ingestion-job-repository";
import { submitTabularUploadToQueue } from "@/features/ingestion/services/submit-tabular-upload-to-queue";
import { readCuratedAssetDocument } from "@/features/ingestion/testing/asset-documents";
import { createLocalParserArtifactRepository } from "@/features/parsing/repositories/local-parser-artifact-repository";
import { createLocalTextParserArtifactRepository } from "@/features/parsing/repositories/local-text-parser-artifact-repository";
import { createLocalObjectStorage } from "@/features/storage/lib/local-object-storage";

import { processNextIngestionJob } from "./process-next-ingestion-job";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("processNextIngestionJob integration", () => {
  it("parses a real asset-backed sales export and persists the parser artifact", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-process-asset-"),
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
    const textParserArtifactRepository = createLocalTextParserArtifactRepository({
      rootDirectory: recordsRoot,
    });
    const queue = createInMemoryIngestionQueue();
    const storage = createLocalObjectStorage({
      now: () => "2026-04-09T20:10:00.000Z",
      rootDirectory: path.join(rootDirectory, "storage"),
    });
    const uploadBody = await readCuratedAssetDocument(
      "supermarket_sales - Sheet1.csv",
    );

    const submittedUpload = await submitTabularUploadToQueue({
      body: uploadBody,
      documentRepository,
      fileName: "supermarket_sales - Sheet1.csv",
      ingestionEventRepository,
      ingestionJobRepository,
      now: () => "2026-04-09T20:10:00.000Z",
      orgId: "org_123",
      queue,
      storage,
    });

    const processedUpload = await processNextIngestionJob({
      documentRepository,
      generateId: () => "artifact_123",
      ingestionJobRepository,
      now: () => "2026-04-09T20:10:01.000Z",
      parserArtifactRepository,
      queue,
      storage,
      textParserArtifactRepository,
    });
    const parserArtifact = processedUpload?.parserArtifact;
    const persistedDocument = await documentRepository.getById(
      submittedUpload.document.id,
    );
    const persistedArtifact = await parserArtifactRepository.getById("artifact_123");

    expect(processedUpload).not.toBeNull();
    expect(parserArtifact).toBeDefined();
    expect(processedUpload?.ingestionJob.status).toBe("extracting");
    expect(parserArtifact).toMatchObject({
      documentId: submittedUpload.document.id,
      parserKind: "csv",
      sheetCount: 1,
      totalRowCount: 1000,
    });
    expect(parserArtifact?.sheets[0]).toMatchObject({
      columnCount: 17,
      name: "Sheet1",
      rowCount: 1000,
    });
    expect(parserArtifact?.sheets[0]?.headers).toEqual([
      "invoice_id",
      "branch",
      "city",
      "customer_type",
      "gender",
      "product_line",
      "unit_price",
      "quantity",
      "tax_5%",
      "total",
      "date",
      "time",
      "payment",
      "cogs",
      "gross_margin_percentage",
      "gross_income",
      "rating",
    ]);
    expect(persistedDocument?.status).toBe("parsed");
    expect(persistedArtifact).toMatchObject({
      id: "artifact_123",
      totalRowCount: 1000,
    });
  });
});
