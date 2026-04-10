import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createLocalDocumentRepository } from "@/features/documents/repositories/local-document-repository";
import { createInMemoryIngestionQueue } from "@/features/ingestion/queue/in-memory-ingestion-queue";
import { createLocalIngestionEventRepository } from "@/features/ingestion/repositories/local-ingestion-event-repository";
import { createLocalIngestionJobRepository } from "@/features/ingestion/repositories/local-ingestion-job-repository";
import { submitTabularUploadToQueue } from "@/features/ingestion/services/submit-tabular-upload-to-queue";
import { createLocalObjectStorage } from "@/features/storage/lib/local-object-storage";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("submitTabularUploadToQueue", () => {
  it("stores the raw upload, persists job state, and enqueues background work", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-submit-queue-"),
    );
    temporaryDirectories.push(rootDirectory);

    const storage = createLocalObjectStorage({
      now: () => "2026-04-09T18:00:00.000Z",
      rootDirectory: path.join(rootDirectory, "storage"),
    });
    const documentRepository = createLocalDocumentRepository({
      rootDirectory: path.join(rootDirectory, "records"),
    });
    const ingestionEventRepository = createLocalIngestionEventRepository({
      rootDirectory: path.join(rootDirectory, "records"),
    });
    const ingestionJobRepository = createLocalIngestionJobRepository({
      rootDirectory: path.join(rootDirectory, "records"),
    });
    const queue = createInMemoryIngestionQueue();
    const ids = ["doc_123", "job_123"];

    const result = await submitTabularUploadToQueue({
      body: Buffer.from(
        "Invoice Number,Customer Name,Due Date,Amount Due\nINV-001,Acme Heating,2026-04-14,4200",
        "utf8",
      ),
      documentRepository,
      fileName: "customer-invoice-export.csv",
      generateId: () => ids.shift() ?? "extra_id",
      ingestionEventRepository,
      ingestionJobRepository,
      now: () => "2026-04-09T18:00:00.000Z",
      orgId: "org_123",
      queue,
      storage,
    });

    expect(result.document.status).toBe("stored");
    expect(result.storageObject).toBeDefined();
    expect(result.document.checksumSha256).toBe(result.storageObject!.sha256);
    expect(result.document.sizeBytes).toBe(result.storageObject!.sizeBytes);
    expect(result.ingestionEvent.kind).toBe("upload.queued");
    expect(result.ingestionJob.status).toBe("queued");
    expect(result.isDuplicate).toBe(false);
    expect(result.queueMessage?.jobId).toBe("job_123");
    expect(await queue.size()).toBe(1);
    expect(await documentRepository.getById(result.document.id)).toMatchObject({
      id: "doc_123",
      status: "stored",
    });
    expect(
      await ingestionJobRepository.getById(result.ingestionJob.id),
    ).toMatchObject({
      id: "job_123",
      status: "queued",
    });
    await expect(
      ingestionEventRepository.listByDocumentId(result.document.id),
    ).resolves.toHaveLength(1);
  });

  it("deduplicates repeated uploads by org and checksum", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-submit-queue-"),
    );
    temporaryDirectories.push(rootDirectory);

    const storage = createLocalObjectStorage({
      now: () => "2026-04-09T18:00:00.000Z",
      rootDirectory: path.join(rootDirectory, "storage"),
    });
    const documentRepository = createLocalDocumentRepository({
      rootDirectory: path.join(rootDirectory, "records"),
    });
    const ingestionEventRepository = createLocalIngestionEventRepository({
      rootDirectory: path.join(rootDirectory, "records"),
    });
    const ingestionJobRepository = createLocalIngestionJobRepository({
      rootDirectory: path.join(rootDirectory, "records"),
    });
    const queue = createInMemoryIngestionQueue();
    const firstIds = ["doc_123", "job_123", "event_123"];
    const secondIds = ["doc_456", "job_456", "event_456"];
    const body = Buffer.from(
      "Invoice Number,Customer Name,Due Date,Amount Due\nINV-001,Acme Heating,2026-04-14,4200",
      "utf8",
    );

    const firstUpload = await submitTabularUploadToQueue({
      body,
      documentRepository,
      fileName: "customer-invoice-export.csv",
      generateId: () => firstIds.shift() ?? "first_extra_id",
      ingestionEventRepository,
      ingestionJobRepository,
      now: () => "2026-04-09T18:00:00.000Z",
      orgId: "org_123",
      queue,
      storage,
    });

    const secondUpload = await submitTabularUploadToQueue({
      body,
      documentRepository,
      fileName: "customer-invoice-export-copy.csv",
      generateId: () => secondIds.shift() ?? "second_extra_id",
      ingestionEventRepository,
      ingestionJobRepository,
      now: () => "2026-04-09T18:01:00.000Z",
      orgId: "org_123",
      queue,
      storage,
    });

    expect(secondUpload.document.id).toBe(firstUpload.document.id);
    expect(secondUpload.ingestionJob.id).toBe(firstUpload.ingestionJob.id);
    expect(secondUpload.ingestionEvent.kind).toBe("upload.duplicate");
    expect(secondUpload.isDuplicate).toBe(true);
    expect(secondUpload.queueMessage).toBeUndefined();
    expect(await queue.size()).toBe(1);
    await expect(
      ingestionEventRepository.listByDocumentId(firstUpload.document.id),
    ).resolves.toHaveLength(2);
  });

  it("emits sanitized ingestion logs without raw file identifiers", async () => {
    const rootDirectory = await mkdtemp(
      path.join(os.tmpdir(), "bizopsaccelerator-submit-queue-log-"),
    );
    temporaryDirectories.push(rootDirectory);

    const storage = createLocalObjectStorage({
      now: () => "2026-04-09T18:00:00.000Z",
      rootDirectory: path.join(rootDirectory, "storage"),
    });
    const documentRepository = createLocalDocumentRepository({
      rootDirectory: path.join(rootDirectory, "records"),
    });
    const ingestionEventRepository = createLocalIngestionEventRepository({
      rootDirectory: path.join(rootDirectory, "records"),
    });
    const ingestionJobRepository = createLocalIngestionJobRepository({
      rootDirectory: path.join(rootDirectory, "records"),
    });
    const queue = createInMemoryIngestionQueue();
    const emittedLogs: string[] = [];

    await submitTabularUploadToQueue({
      body: Buffer.from("Invoice Number,Amount Due\nINV-001,4200", "utf8"),
      documentRepository,
      fileName: "customer-jane.doe@example.com-invoice.csv",
      ingestionEventRepository,
      ingestionJobRepository,
      log: (serializedEntry) => emittedLogs.push(serializedEntry),
      now: () => "2026-04-09T18:00:00.000Z",
      orgId: "org_123",
      queue,
      storage,
    });

    expect(emittedLogs).toHaveLength(1);
    expect(emittedLogs[0]).not.toContain("jane.doe@example.com");
    expect(emittedLogs[0]).not.toContain("\"objectKey\":\"");
    expect(emittedLogs[0]).toContain("\"kind\":\"object_key\"");
    expect(emittedLogs[0]).toContain("\"kind\":\"digest\"");
  });
});
