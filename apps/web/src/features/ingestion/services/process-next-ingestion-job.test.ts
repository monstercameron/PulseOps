import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createLocalDocumentRepository } from "@/features/documents/repositories/local-document-repository";
import { createDeterministicTextEmbedder } from "@/features/chunks/lib/deterministic-embedder";
import { createLocalChunkRepository } from "@/features/chunks/repositories/local-chunk-repository";
import { createLocalEntityRepository } from "@/features/entities/repositories/local-entity-repository";
import { createExtractionContract } from "@/features/extraction/domain/extraction-contract";
import { createLocalFactRepository } from "@/features/facts/repositories/local-fact-repository";
import { createInMemoryIngestionQueue } from "@/features/ingestion/queue/in-memory-ingestion-queue";
import { createLocalIngestionEventRepository } from "@/features/ingestion/repositories/local-ingestion-event-repository";
import { createLocalIngestionJobRepository } from "@/features/ingestion/repositories/local-ingestion-job-repository";
import {
  ProcessNextIngestionJobError,
  processNextIngestionJob,
} from "@/features/ingestion/services/process-next-ingestion-job";
import { submitTabularUploadToQueue } from "@/features/ingestion/services/submit-tabular-upload-to-queue";
import { createLocalParserArtifactRepository } from "@/features/parsing/repositories/local-parser-artifact-repository";
import { createLocalTextParserArtifactRepository } from "@/features/parsing/repositories/local-text-parser-artifact-repository";
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

describe("processNextIngestionJob", () => {
  it("processes queued uploads and persists parser artifacts", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-process-queue-"),
    );
    temporaryDirectories.push(rootDirectory);

    const storage = createLocalObjectStorage({
      now: () => "2026-04-09T19:00:00.000Z",
      rootDirectory: path.join(rootDirectory, "storage"),
    });
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
    const ids = ["doc_123", "job_123"];

    await submitTabularUploadToQueue({
      body: Buffer.from(
        "Invoice Number,Customer Name,Due Date,Amount Due\nINV-001,Acme Heating,2026-04-14,4200",
        "utf8",
      ),
      documentRepository,
      fileName: "customer-invoice-export.csv",
      generateId: () => ids.shift() ?? "extra_id",
      ingestionEventRepository,
      ingestionJobRepository,
      now: () => "2026-04-09T19:00:00.000Z",
      orgId: "org_123",
      queue,
      storage,
    });

    const queuedResult = await processNextIngestionJob({
      documentRepository,
      generateId: () => "artifact_123",
      ingestionJobRepository,
      now: () => "2026-04-09T19:00:01.000Z",
      parserArtifactRepository,
      queue,
      storage,
      textParserArtifactRepository,
    });
    const parserArtifact = queuedResult?.parserArtifact;

    expect(queuedResult).not.toBeNull();
    expect(parserArtifact).toBeDefined();
    expect(queuedResult?.ingestionJob.status).toBe("extracting");
    expect(parserArtifact?.id).toBe("artifact_123");
    expect(
      await parserArtifactRepository.getById("artifact_123"),
    ).toMatchObject({
      documentId: "doc_123",
      parserKind: "csv",
    });
    expect(await queue.size()).toBe(0);
  });

  it("marks persisted state as failed when queued processing cannot parse the file", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-process-failure-"),
    );
    temporaryDirectories.push(rootDirectory);

    const storage = createLocalObjectStorage({
      now: () => "2026-04-09T19:30:00.000Z",
      rootDirectory: path.join(rootDirectory, "storage"),
    });
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
    const ids = ["doc_223", "job_223"];

    await submitTabularUploadToQueue({
      body: Buffer.from([0x00, 0x01, 0x02, 0x03]),
      documentRepository,
      fileName: "notes.bin",
      generateId: () => ids.shift() ?? "extra_id",
      ingestionEventRepository,
      ingestionJobRepository,
      now: () => "2026-04-09T19:30:00.000Z",
      orgId: "org_123",
      queue,
      storage,
    });

    await expect(
      processNextIngestionJob({
        documentRepository,
        generateId: () => "artifact_223",
        ingestionJobRepository,
        now: () => "2026-04-09T19:30:01.000Z",
        parserArtifactRepository,
        queue,
        storage,
        textParserArtifactRepository,
      }),
    ).rejects.toBeInstanceOf(ProcessNextIngestionJobError);

    expect(await documentRepository.getById("doc_223")).toMatchObject({
      id: "doc_223",
      status: "failed",
    });
    expect(await ingestionJobRepository.getById("job_223")).toMatchObject({
      id: "job_223",
      status: "failed",
    });
  });

  it("processes supported text uploads and persists text parser artifacts", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-process-text-"),
    );
    temporaryDirectories.push(rootDirectory);

    const storage = createLocalObjectStorage({
      now: () => "2026-04-09T19:45:00.000Z",
      rootDirectory: path.join(rootDirectory, "storage"),
    });
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
    const ids = ["doc_323", "job_323"];

    await submitTabularUploadToQueue({
      body: Buffer.from(
        JSON.stringify({
          amountDue: 4200,
          invoiceId: "INV-001",
        }),
        "utf8",
      ),
      documentRepository,
      fileName: "invoice.json",
      generateId: () => ids.shift() ?? "extra_id",
      ingestionEventRepository,
      ingestionJobRepository,
      now: () => "2026-04-09T19:45:00.000Z",
      orgId: "org_123",
      queue,
      storage,
    });

    const queuedResult = await processNextIngestionJob({
      documentRepository,
      generateId: () => "text_artifact_323",
      ingestionJobRepository,
      now: () => "2026-04-09T19:45:01.000Z",
      parserArtifactRepository,
      queue,
      storage,
      textParserArtifactRepository,
    });

    expect(queuedResult).not.toBeNull();
    expect(queuedResult?.textParserArtifact).toBeDefined();
    expect(queuedResult?.format).toBe("json");
    expect(queuedResult?.ingestionJob.status).toBe("completed");
    expect(queuedResult?.textParserArtifact?.id).toBe("text_artifact_323");
    expect(
      await textParserArtifactRepository.getById("text_artifact_323"),
    ).toMatchObject({
      documentId: "doc_323",
      parserKind: "json",
    });
  });

  it("uses the tabular extraction service to materialize facts and chunks when configured", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-process-ai-extraction-"),
    );
    temporaryDirectories.push(rootDirectory);

    const storage = createLocalObjectStorage({
      now: () => "2026-04-09T20:00:00.000Z",
      rootDirectory: path.join(rootDirectory, "storage"),
    });
    const recordsRoot = path.join(rootDirectory, "records");
    const chunkRepository = createLocalChunkRepository({
      rootDirectory: recordsRoot,
    });
    const documentRepository = createLocalDocumentRepository({
      rootDirectory: recordsRoot,
    });
    const entityRepository = createLocalEntityRepository({
      rootDirectory: recordsRoot,
    });
    const factRepository = createLocalFactRepository({
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
    const ids = ["doc_423", "job_423"];

    await submitTabularUploadToQueue({
      body: Buffer.from(
        "invoice_number,customer_name,due_date,amount_due\nINV-001,Acme Heating,2026-04-14,4200",
        "utf8",
      ),
      documentRepository,
      fileName: "customer-invoice-export.csv",
      generateId: () => ids.shift() ?? "extra_id",
      ingestionEventRepository,
      ingestionJobRepository,
      now: () => "2026-04-09T20:00:00.000Z",
      orgId: "org_123",
      queue,
      storage,
    });

    const queuedResult = await processNextIngestionJob({
      chunkRepository,
      documentRepository,
      embedder: createDeterministicTextEmbedder({
        dimensions: 8,
      }),
      entityRepository,
      factRepository,
      generateId: () => "artifact_423",
      ingestionJobRepository,
      now: () => "2026-04-09T20:00:01.000Z",
      parserArtifactRepository,
      queue,
      storage,
      documentExtractionService: {
        extract: async ({ document }) =>
          createExtractionContract({
            createdAt: "2026-04-09T20:00:01.000Z",
            documentFamily: "customer-invoice",
            documentId: document.id,
            fields: [
              {
                citations: [
                  createCitation({
                    confidenceScore: 0.97,
                    documentFamily: "customer-invoice",
                    documentId: document.id,
                    locator: {
                      column: "invoice_number",
                      row: 2,
                      sheet: "Sheet1",
                    },
                    locatorType: "cell",
                    sourceHash: "sha256:invoice-number",
                  }),
                ],
                confidenceScore: 0.97,
                key: "sheet1.row_2.invoice_number",
                label: "Invoice number",
                value: "INV-001",
              },
              {
                canonicalFactTypeId: "invoice.amount.outstanding",
                citations: [
                  createCitation({
                    confidenceScore: 0.96,
                    documentFamily: "customer-invoice",
                    documentId: document.id,
                    locator: {
                      column: "amount_due",
                      row: 2,
                      sheet: "Sheet1",
                    },
                    locatorType: "cell",
                    sourceHash: "sha256:amount-due",
                  }),
                ],
                confidenceScore: 0.96,
                key: "sheet1.row_2.amount_outstanding",
                label: "Amount outstanding",
                value: 4200,
              },
            ],
          }),
      },
      textParserArtifactRepository,
    });

    expect(queuedResult?.ingestionJob.status).toBe("completed");
    expect(queuedResult?.materializedFactCount).toBe(1);
    expect(queuedResult?.materializedChunkCount).toBe(1);
    expect(queuedResult?.extractionContractFieldCount).toBe(2);
    expect(await factRepository.listByDocumentId("doc_423")).toMatchObject([
      {
        canonicalFactTypeId: "invoice.amount.outstanding",
        documentId: "doc_423",
      },
    ]);
    expect(await chunkRepository.listByDocumentId("doc_423")).toHaveLength(1);
    expect(await documentRepository.getById("doc_423")).toMatchObject({
      id: "doc_423",
      status: "extracted",
    });
  });

  it("materializes generic facts and chunks for extracted text documents", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-process-text-extraction-"),
    );
    temporaryDirectories.push(rootDirectory);

    const storage = createLocalObjectStorage({
      now: () => "2026-04-09T20:30:00.000Z",
      rootDirectory: path.join(rootDirectory, "storage"),
    });
    const recordsRoot = path.join(rootDirectory, "records");
    const chunkRepository = createLocalChunkRepository({
      rootDirectory: recordsRoot,
    });
    const documentRepository = createLocalDocumentRepository({
      rootDirectory: recordsRoot,
    });
    const entityRepository = createLocalEntityRepository({
      rootDirectory: recordsRoot,
    });
    const factRepository = createLocalFactRepository({
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
    const ids = ["doc_523", "job_523"];

    await submitTabularUploadToQueue({
      body: Buffer.from(
        "Statement\nBusiness: Northwind Plumbing\nBalance due: 4200\nUrgent collection recommended.",
        "utf8",
      ),
      documentRepository,
      fileName: "collections-notes.txt",
      generateId: () => ids.shift() ?? "extra_id",
      ingestionEventRepository,
      ingestionJobRepository,
      now: () => "2026-04-09T20:30:00.000Z",
      orgId: "org_123",
      queue,
      storage,
    });

    const queuedResult = await processNextIngestionJob({
      chunkRepository,
      documentRepository,
      embedder: createDeterministicTextEmbedder({
        dimensions: 8,
      }),
      entityRepository,
      factRepository,
      generateId: () => "text_artifact_523",
      ingestionJobRepository,
      now: () => "2026-04-09T20:30:01.000Z",
      parserArtifactRepository,
      queue,
      storage,
      documentExtractionService: {
        extract: async ({ document, parserRoute }) =>
          createExtractionContract({
            createdAt: "2026-04-09T20:30:01.000Z",
            documentFamily: "generic-business-document",
            documentId: document.id,
            fields:
              parserRoute !== "text"
                ? []
                : [
                    {
                      citations: [
                        createCitation({
                          confidenceScore: 0.91,
                          documentFamily: "generic-business-document",
                          documentId: document.id,
                          locator: {
                            lineEnd: 2,
                            lineStart: 2,
                          },
                          locatorType: "line-range",
                          sourceHash: "sha256:business-name",
                        }),
                      ],
                      confidenceScore: 0.91,
                      key: "business_name",
                      label: "Business name",
                      value: "Northwind Plumbing",
                    },
                    {
                      citations: [
                        createCitation({
                          confidenceScore: 0.95,
                          documentFamily: "generic-business-document",
                          documentId: document.id,
                          locator: {
                            lineEnd: 3,
                            lineStart: 3,
                          },
                          locatorType: "line-range",
                          sourceHash: "sha256:balance-due",
                        }),
                      ],
                      confidenceScore: 0.95,
                      key: "balance_due",
                      label: "Balance due",
                      value: 4200,
                      canonicalFactTypeId: "document.observation.number",
                    },
                  ],
          }),
      },
      textParserArtifactRepository,
    });

    expect(queuedResult?.format).toBe("txt");
    expect(queuedResult?.ingestionJob.status).toBe("completed");
    expect(queuedResult?.materializedFactCount).toBe(1);
    expect(queuedResult?.materializedChunkCount).toBe(1);
    expect(await factRepository.listByDocumentId("doc_523")).toMatchObject([
      {
        canonicalFactTypeId: "document.observation.number",
        documentId: "doc_523",
        label: "Balance due",
      },
    ]);
    expect(await chunkRepository.listByDocumentId("doc_523")).toMatchObject([
      {
        content: expect.stringContaining("Balance due: 4200"),
      },
    ]);
    expect(await documentRepository.getById("doc_523")).toMatchObject({
      id: "doc_523",
      status: "extracted",
    });
  });

  it("purges the stored raw upload after processing when retention is disabled", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-process-purge-"),
    );
    temporaryDirectories.push(rootDirectory);

    const storage = createLocalObjectStorage({
      now: () => "2026-04-09T21:00:00.000Z",
      rootDirectory: path.join(rootDirectory, "storage"),
    });
    const recordsRoot = path.join(rootDirectory, "records");
    const chunkRepository = createLocalChunkRepository({
      rootDirectory: recordsRoot,
    });
    const documentRepository = createLocalDocumentRepository({
      rootDirectory: recordsRoot,
    });
    const entityRepository = createLocalEntityRepository({
      rootDirectory: recordsRoot,
    });
    const factRepository = createLocalFactRepository({
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
    const ids = ["doc_623", "job_623"];

    const submittedUpload = await submitTabularUploadToQueue({
      body: Buffer.from(
        "invoice_number,customer_name,due_date,amount_due\nINV-001,Acme Heating,2026-04-14,4200",
        "utf8",
      ),
      documentRepository,
      fileName: "customer-invoice-export.csv",
      generateId: () => ids.shift() ?? "extra_id",
      ingestionEventRepository,
      ingestionJobRepository,
      now: () => "2026-04-09T21:00:00.000Z",
      orgId: "org_123",
      queue,
      retainSourceFile: false,
      storage,
    });

    expect(submittedUpload.document.rawObject?.key).toBeDefined();
    await expect(
      storage.exists(submittedUpload.document.rawObject!.key),
    ).resolves.toBe(true);

    await processNextIngestionJob({
      chunkRepository,
      documentRepository,
      embedder: createDeterministicTextEmbedder({
        dimensions: 8,
      }),
      entityRepository,
      factRepository,
      generateId: () => "artifact_623",
      ingestionJobRepository,
      now: () => "2026-04-09T21:00:01.000Z",
      parserArtifactRepository,
      queue,
      storage,
      documentExtractionService: {
        extract: async ({ document }) =>
          createExtractionContract({
            createdAt: "2026-04-09T21:00:01.000Z",
            documentFamily: "customer-invoice",
            documentId: document.id,
            fields: [
              {
                canonicalFactTypeId: "invoice.amount.outstanding",
                citations: [
                  createCitation({
                    confidenceScore: 0.96,
                    documentFamily: "customer-invoice",
                    documentId: document.id,
                    locator: {
                      column: "amount_due",
                      row: 2,
                      sheet: "Sheet1",
                    },
                    locatorType: "cell",
                    sourceHash: "sha256:amount-due",
                  }),
                ],
                confidenceScore: 0.96,
                key: "sheet1.row_2.amount_outstanding",
                label: "Amount outstanding",
                value: 4200,
              },
            ],
          }),
      },
      textParserArtifactRepository,
    });

    const persistedDocument = await documentRepository.getById("doc_623");

    expect(persistedDocument).toMatchObject({
      id: "doc_623",
      retentionPolicyKey: "manual-upload-hot-30d-purge-source",
      status: "extracted",
    });
    expect(persistedDocument?.rawObject).toBeUndefined();
    await expect(
      storage.exists(submittedUpload.document.rawObject!.key),
    ).resolves.toBe(false);
  });
});
